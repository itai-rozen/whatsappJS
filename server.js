const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const qrcode = require('qrcode');
const path = require('path')
const cors = require('cors')
const fs = require('fs');
const mongoose = require('mongoose')
const cron = require('node-cron')
const { Server } = require('socket.io')
app.use(express.static(path.join(__dirname, 'client/build')));
const puppeteer = require('puppeteer')
// puppeteer.launch({ args: });


const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
})


const Message = require('./model/message.js')
const History = require('./model/history.js')

require('dotenv').config()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const { Client, LegacySessionAuth } = require('whatsapp-web.js');


// Path where the session data will be stored
const SESSION_FILE_PATH = './session.json';

let sessionData
let client
let task

const clientOpts = {
  authStrategy: new LegacySessionAuth({
    session: sessionData
  }),
  puppeteer: { args: ['--no-sandbox'] }
}

// Load the session data if it has been previously saved

if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionData = require(SESSION_FILE_PATH);
  client = new Client(clientOpts)
  startCronJob()
  client.initialize()
}


app.get('/is-connected', (req, res) => {
  res.send(fs.existsSync(SESSION_FILE_PATH))
})

app.get('/connect', (req, res) => {

  client = new Client(clientOpts)

  client.on('authenticated', async (session) => {
    io.emit('test', 'entered authentication event')

    try {
      sessionData = session;
      fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
        if (err) {
          console.error(err);
        }
      });
    } catch (err) {
      console.log(err)
    }
  });

  client.on('qr', qr => {
    io.emit('test', 'entered qr event')

    // qrcode.generate(qr, { small: true });
    qrcode.toDataURL(qr, (err, src) => {
      io.emit('getQr', src)
    })
  });


  client.on('ready', () => {
    io.emit('test', 'entered ready event')

    startCronJob()
    io.emit('connectUser', true)
  });
  client.initialize();
  res.send('kill me')

})

app.get('/disconnect', async (req, res) => {
  try {
    fs.unlinkSync(SESSION_FILE_PATH)
    await client.logout()
    client = ''
    sessionData = ''
    task.stop()
    io.emit('connectUser', false)
    res.status(200).send()
  } catch (err) {
    res.status(400).send(err)
  }
})

app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({_id: 1}).limit(50)
    res.send(messages)
  } catch (err) {
    res.status(400).send(err)
  }
})

app.get('/history', async (req, res) => {
  try {
    const history = await History.find().sort({ _id: -1 }).limit(50)
    res.send(history)
  } catch (err) {
    res.status(400).send(err)
  }
})


// for testing
app.post('/messages', async (req, res) => {
  console.log('POST /messages')
  const oldest30Messages = await Message.find().sort({ _id: 1 }).limit(1)
  sendIntervaledMessages(oldest30Messages)
  res.end()
})

app.post('/delete-message',  async (req,res) => {
  const { id } = await req.body
  try {
    await Message.deleteOne({_id: id})
  } catch(err) {
    console.log(err)
  }
  res.end()
})

// for testing
app.post('/newMsg', async (req, res) => {
  const { body } = req
  try {
    const message = new Message(body)
    await message.save()
    res.end()
  } catch (err) {
    res.status(400).send(err)
  }
})

app.get('/start-cron', (req, res) => {
  try {
    task.start()
    console.log('cron job started')
    res.send('cron job started successfully')
  } catch (err) {
    console.log(err)
    res.send('error at starting cron job')
  }
})

app.get('/stop-cron', (req, res) => {
  try {
    task.stop()
    console.log('cron job stopped')
    res.send('cron job stopped successfully')
  } catch (err) {
    console.log(err)
    res.send('error at stopping cron job')
  }
})

const handleRecipientStack = async () => {
  io.emit('cronDate', new Date())
  try {
    const messagesStack = await Message.find().sort({ _id: 1 }).limit(30)
    console.log('messages: ', messagesStack.length)
    sendIntervaledMessages(messagesStack)
  } catch (err) {
    console.log('err: ', err)
  }
}

const sendIntervaledMessages = async messages => {
  try {

    for (const message of messages) {
      const numberId = await client.getNumberId(message.phone)
      const serializedId = numberId._serialized
      const randNum = Math.floor(Math.random() * 6 + 10)
      await new Promise(resolve => setTimeout(resolve, randNum * 1000))
      sendAutoMsg(message, serializedId)
    }
  } catch (err) {
    console.log('@sendInterval message: ', err)
  }

}

const sendAutoMsg = async (msg, id) => {
  console.log('@sendAutoMsg func')
  let error = ''
  try {
    const message = await client.sendMessage(id, msg.content)
  } catch (err) {
    console.log(err)
    error = err
  }

  try {
    const isAdded = await addToHistoryQue(msg, error)
    if (isAdded) deleteFromMessagesQue(msg._id)
  } catch (err) {
    console.log(err)
  }

}

const addToHistoryQue = async (msg, crash_log = '') => {
  const { phone, content, provider } = msg
  try {
    const historyDocument = new History({ phone, content, provider, crash_log })
    await historyDocument.save()
    const historyMessages = await History.find()
    io.emit('historyQue', historyMessages)
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

const deleteFromMessagesQue = async id => {
  try {
    await Message.deleteOne({ _id: id })
    const messages = await Message.find()
    io.emit('messageQue', messages)
  } catch (err) {
    console.log(err)
  }
}

function startCronJob() {
  task = cron.schedule('*/5 * * * *', () => {
    handleRecipientStack()
    setTimeout(stopAndRestartTask, 5 * 60 * 1000 - 2000)
  })
}

const stopAndRestartTask = () => {
  task.stop()
  console.log('cron job stopped')
  task.start()
}

const mongoUrl = `mongodb+srv://itai_rozen:${process.env.MONGO_PASS}@cluster0.sihrb.mongodb.net/${process.env.DB}?retryWrites=true&w=majority`
server.listen(process.env.PORT, () => {
  mongoose.connect(mongoUrl, () => {
    console.log('mongo & server connected')
  })
})
