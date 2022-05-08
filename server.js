const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const qrcode = require('qrcode');
const path = require('path')
const cors = require('cors')
const fs = require('fs-extra')
const mongoose = require('mongoose')
const cron = require('node-cron')
const { Server } = require('socket.io')
app.use(express.static(path.join(__dirname, 'client/build')));
const bcrypt = require('bcrypt')
const router = express.Router()
const auth = require('./middlewares/auth')
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
})

const MESSAGES_PER_PAGE = 10
const Message = require('./model/message.js')
const History = require('./model/history.js')

require('dotenv').config()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/api', router)
const { Client, LocalAuth, NoAuth } = require('whatsapp-web.js');


// Path where the session data will be stored
const SESSION_FILE_PATH = './sessions';
// const TOKEN_FILE_PATH = './token.json'

// let sessionData
let client
let task
let isStopped = false



const clientOpts = {
  // authStrategy: new NoAuth(),
  authStrategy: new LocalAuth({dataPath: SESSION_FILE_PATH}),
  puppeteer: { args: ['--no-sandbox'] }
}

// Load the session data if it has been previously saved

if (fs.existsSync(SESSION_FILE_PATH)) {
  console.log('client session exist')
  initializeClient()
  startCronJob()
}



router.get('/is-connected', (req, res) => {
  res.send(fs.existsSync(SESSION_FILE_PATH))
})

router.get('/connect', auth, (req, res) => {
  initializeClient()
  res.send('kill me')
})

try {
  console.log(fs.existsSync(SESSION_FILE_PATH))
  // console.log(fs.existsSync(SESSION_FILE_PATH, )
  // console.log(fs.readdirSync(SESSION_FILE_PATH))
} catch(err) {
  console.log('error while deleting: ',err)
}

router.get('/disconnect', auth, async (req, res) => {
  try {
    fs.rmdirSync(SESSION_FILE_PATH, { recursive: true })
    if (client) await client.destroy()
    client = ''
    // sessionData = ''
    task.stop()
    io.emit('connectUser', false)
    res.status(200).send()
  } catch (err) {
    console.log(err)
    res.status(400).send(err.message)
  }
})

router.post('/messages', auth, async (req, res) => {
  const { phone = "", content = "", limit = MESSAGES_PER_PAGE, page } = req.body
  try {
    const messages = await Message
      .find({ "phone": { "$regex": phone, "$options": "i" }, "content": { "$regex": content } })
      .sort({ _id: 1 })
      .limit(limit)
      .skip((page - 1) * limit)
    const count = await Message.count({ "phone": { "$regex": phone, "$options": "i" }, "content": { "$regex": content } })
    res.status(200).send({ messages, count, pages: Math.ceil(count / limit) })
  } catch (err) {
    res.status(400).send(err)
  }
})

router.post('/history', auth, async (req, res) => {
  const { phone = "", content = "", limit = MESSAGES_PER_PAGE, page } = req.body
  try {
    const history = await History
      .find({ "phone": { "$regex": phone, "$options": "i" }, "content": { "$regex": content } })
      .sort({ _id: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
    const count = await History.count({ "phone": { "$regex": phone, "$options": "i" }, "content": { "$regex": content } })
    res.status(200).send({ messages: history, count, pages: Math.ceil(count / limit) })
  } catch (err) {
    console.log(err)
    res.status(400).send(err)
  }
})


// for testing
router.post('/send-messages', async (req, res) => {
  console.log('POST /send-messages')
  const oldest30Messages = await Message.find().sort({ _id: 1 }).limit(1)
  sendIntervaledMessages(oldest30Messages)
  res.end()
})

router.post('/delete-message', auth, async (req, res) => {
  const { id } = await req.body
  try {
    await Message.deleteOne({ _id: id })
  } catch (err) {
    console.log(err)
  }
  res.end()
})

// for testing
router.post('/newMsg', async (req, res) => {
  const { body } = req
  try {
    const message = new Message(body)
    await message.save()
    res.status(200).send()
  } catch (err) {
    res.status(400).send(err)
  }
})

router.get('/start-cron', auth, (req, res) => {
  try {
    task.start()
    isStopped = false
    console.log('cron job started')
    res.send('cron job started successfully')
  } catch (err) {
    console.log(err)
    res.send('error at starting cron job')
  }
})

router.get('/stop-cron', auth, (req, res) => {
  try {
    task.stop()
    isStopped = true
    console.log('cron job stopped')
    res.send('cron job stopped successfully')
  } catch (err) {
    console.log(err)
    res.send('error at stopping cron job')
  }
})

// router.get('/*', (req,res) => {
// res.sendFile(path.join(__dirname, 'build', 'index.html'));
// res.redirect('/')
// })

// const tokenManager = () => {
// const tokenData = process.env.ACCESS_TOKEN
// const { token, created_at } = tokenData
// const createTokenPayload = () => {
//  const randomStr =  Math.random().toString(36).substring(2);
//  const payloadToken = randomStr + randomStr
//  const payload = { token: payloadToken, created_at: Math.round(new Date().getTime() / 1000) }
//  fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(payload))
//  return payload
// }
// let returnedPayload
// switch (created_at) {
//   case null:
//   returnedPayload =  createTokenPayload();
//   case (Math.round(new Date().getTime() / 1000) - created_at > 6.048e+8) :
//   returnedPayload =  createTokenPayload();

//   default:
//   returnedPayload = tokenData
//     break;
// }
// return returnedPayload.token
// }h

router.post('/login', async (req, res) => {
  const { password } = req.body

  const token = process.env.ACCESS_TOKEN
  try {
    const isValid = await bcrypt.compare(password, process.env.LOGIN_PASS)
    if (isValid) res.status(200).send({ tokenstring: token }).json()
    else throw Error('login failed. invalid password')
  } catch (err) {
    res.status(400).send(err.message)
  }
})

router.post('/search', auth, async (req, res) => {
  const { phone, content, collection } = req.body
  const collectionName = collection === 'history' ? History : Message
  try {
    const count = await collectionName.count({ "phone": { "$regex": phone, "$options": "i" }, "content": { "$regex": content } })
  } catch (err) {
    console.log(err)
  }

})

async function initializeClient() {
  client = new Client(clientOpts)

  client.on('authenticated', (session) => {
    console.log('auth event')
    io.emit('test', 'authentication successfull')
  });

  client.on('qr', qr => {
    console.log('qr event')
    io.emit('test', 'entered qr event')

    // qrcode.generate(qr, { small: true });
    qrcode.toDataURL(qr, (err, src) => {
      io.emit('getQr', src)
    })
  });
  client.on('ready', async () => {
    io.emit('test', 'entered ready event')
    console.log('ready event')
    startCronJob()
  })
  try {
    await client.initialize()
  } catch (err) {
    console.log('error @init: ', err)
  }
  console.log('alitn initialized')
  io.emit('connectUser', true)
  return
}

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
      console.log('phone num: ', message.phone)
      console.log(client ? 'client exist' : 'no client')
      const numberId = await client.getNumberId(message.phone)
      console.log('number id: ', numberId)
      const serializedId = numberId._serialized
      // const serializedId = message.phone + `@c.us`
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
    const historyMessages = await History.find().sort({ _id: -1 }).limit(MESSAGES_PER_PAGE)
    const count = await History.countDocuments()
    io.emit('historyQue', { messages: historyMessages, count })
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

const deleteFromMessagesQue = async id => {
  try {
    await Message.deleteOne({ _id: id })
    const messages = await Message.find().sort({ _id: 1 }).limit(MESSAGES_PER_PAGE)
    const count = await Message.countDocuments()
    io.emit('messageQue', { messages: messages, count })
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
  if (!isStopped) task.start()
}

const mongoUrl = `mongodb+srv://itai_rozen:${process.env.MONGO_PASS}@cluster0.sihrb.mongodb.net/${process.env.DB}?retryWrites=true&w=majority`
server.listen(process.env.PORT || 4001, () => {
  mongoose.connect(mongoUrl, () => {
    console.log('mongo & server connected')
  })
})
