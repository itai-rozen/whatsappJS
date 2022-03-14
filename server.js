const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const qrcode = require('qrcode');
const cors = require('cors')
const fs = require('fs');
const axios = require('axios')
const mongoose = require('mongoose')
const cron = require('node-cron')
const { Server }  = require('socket.io')
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000']
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

// Load the session data if it has been previously saved
let sessionData
let client
let task
let qrImgSrc




if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionData = require(SESSION_FILE_PATH);
}

app.get('/connect', (req, res) => {

  client = new Client({
    authStrategy: new LegacySessionAuth({
      session: sessionData
    })
  })


  client.on('authenticated', async (session) => {
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
    // qrcode.generate(qr, { small: true });
    qrcode.toDataURL(qr, (err, src) => {
      qrImgSrc = src
      io.emit('getQr', src)
    })
  });


  client.on('ready', async () => {
    console.log('Client is ready!');
    task = cron.schedule('*/5 * * * *', () => {
      handleRecipientStack()
      setTimeout(stopAndRestartTask, 5 * 60 * 1000 - 2000)
    })
    io.emit('connectUser', true)
    res.end()
  });


  client.initialize();
})

app.get('/qr', (req, res) => {
  if (qrImgSrc) res.status(200).send({ qr: qrImgSrc })
  else res.send({ qr: '' })
})

app.get('/disconnect', async (req, res) => {
  try {
    fs.unlinkSync(SESSION_FILE_PATH)
    qrImgSrc = ''
    client = ''
    sessionData = ''
    io.emit('connectUser', false)
    res.status(200).send()
  } catch (err) {
    res.status(400).send(err)
  }
})

app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find()
    res.send(messages)
  } catch (err) {
    res.status(400).send(err)
  }
})

app.get('/history', async (req, res) => {
  try {
    const history = await History.find()
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

const handleRecipientStack = async () => {
  return
  console.log('entered stack')
  try {
    const messagesStack = await Message.find().sort({ _id: 1 }).limit(30)
    console.log('messages: ', messagesStack.length)
    sendIntervaledMessages(messagesStack)
  } catch (err) {
    console.log('err: ', err)
  }
}

const sendIntervaledMessages = async messages => {
  for (const message of messages) {
    const numberId = await client.getNumberId(message.phone)
    const serializedId = numberId._serialized
    const randNum = Math.floor(Math.random() * 6 + 10)
    await new Promise(resolve => setTimeout(resolve, randNum * 1000))
    sendAutoMsg(message, serializedId)
    console.log('sending auto message!')
  }
}

const sendAutoMsg = async (msg, id) => {
  console.log('@sendAutoMsg func')
  let error = ''
  try {
    await client.sendMessage(id, msg.content)
  } catch (err) {
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
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

const deleteFromMessagesQue = async id => {
  try {
    await Message.deleteOne({ _id: id })
  } catch (err) {
    console.log(err)
  }
}

const addMessageToSheets = async messageObj => {
  try {
    await axios.post(process.env.WEBHOOK_PATH, JSON.stringify(messageObj)) // row added to google sheet
  } catch (err) {
    console.log('err @adding to sheets: ', err)
  }
}

const addMessageToMongo = async messageObj => {
  try {
    const message = new Message(messageObj)
    await message.save() // message added to mongoDB
    console.log('message added')
  } catch (err) {
    console.log('err @adding to mongo: ', err)
  }
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

  // if(message.hasMedia) {
  //   try {
  //     const media = await message.downloadMedia();
  //     console.log('media: ',media)
  //     image = media.data
  //   } catch(err){
  //     console.log(err)
  //   }
  // }
      // const contacts = await client.getContacts()

    // client.createGroup('testicles', [manmanit.id._serialized])
    // let groupChatId 
    // const chats = await client.getChats()
    // const testGroup = chats.find(chat => chat.name === 'Test')
    // groupChatId = testGroup.id._serialized
    // console.log('group chat id: ', groupChatId)
    // const groupChat = new groupChat(groupChatId)
    // console.log('group chat: ',groupChat)
    // client.sendMessage(groupChatId,'so cool!')

    // app.post('/', async (req, res) => {
//   const { phone, message, img = undefined } = req.body
//   console.log('img: ', img)
//   const numberId = await client.getNumberId(phone)
//   console.log('number id: ', numberId)
//   if (numberId) {
//     client.sendMessage(numberId._serialized, message)
//     res.send({ message: 'message sent!' })
//   } else res.send({ message: 'phone number is not valid' })
// })

// client.on('message', async message => {
//   const from = message._data.from.replace(/\D/g, '');
//   const content = message.body

//   console.log('message: ', message)
//   const messageObj = {
//     phone: from,
//     content: content
//   }
//   if (!message.author) { // if not from a group chat
//     addMessageToSheets(messageObj)
//     addMessageToMongo(messageObj)
//   }
// });