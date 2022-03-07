const express = require('express')
const app = express()
const qrcode = require('qrcode-terminal');
const cors = require('cors')
const fs = require('fs');
const axios = require('axios')
const mongoose = require('mongoose')
const cron = require('node-cron')
const Message = require('./model/message.js')
require('dotenv').config()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const { Client, LegacySessionAuth } = require('whatsapp-web.js');

// Path where the session data will be stored
const SESSION_FILE_PATH = './session.json';

// Load the session data if it has been previously saved
let sessionData;
if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionData = require(SESSION_FILE_PATH);
}

const client = new Client({
  authStrategy: new LegacySessionAuth({
    session: sessionData
  })
})


client.on('authenticated', (session) => {
  sessionData = session;
  fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
    if (err) {
      console.error(err);
    }
  });
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  console.log('Client is ready!');
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
});


const handleRecipientStack = async () => {
  console.log('entered stack')
  try {
    const messages = await Message.find()
    console.log('messages: ', messages.length)

    const messagesStack = messages.filter(message => !message.isSent)
    console.log('messages in stack: ', messagesStack.length)
    for (const message of messagesStack) {
      const numberId = await client.getNumberId(message.phone)
      const serializedId = numberId._serialized
      const randNum = Math.floor(Math.random() * 6 + 10)
      await new Promise(resolve => setTimeout(resolve, randNum * 1000))
      sendAutoMsg(message, serializedId)
      console.log('sending auto message!')
    }
  } catch (err) {
    console.log('err')
  }
}

const sendAutoMsg = async (msg, id) => {
  console.log('@sendAutoMsg func')
  const msgContent = 'death to all humans!'
  client.sendMessage(id, msgContent)
  updateMessageStatus(msg)
}

const updateMessageStatus = async msg => {
  msg.isSent = true
  await msg.save()
}

client.initialize();

client.on('message', async message => {
  const from = message._data.from.replace(/\D/g, '');
  const content = message.body

  console.log('message: ', message)
  const messageObj = {
    phone: from,
    content: content
  }
  if (!message.author) { // if not from a group chat
    addMessageToSheets(messageObj)
    addMessageToMongo(messageObj)
  }
});

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

app.post('/', async (req, res) => {
  const { phone, message, img = undefined } = req.body
  console.log('img: ', img)
  const numberId = await client.getNumberId(phone)
  console.log('number id: ', numberId)
  if (numberId) {
    client.sendMessage(numberId._serialized, message)
    res.send({ message: 'message sent!' })
  } else res.send({ message: 'phone number is not valid' })
})


let task

const stopAndRestartTask = () => {
  task.stop()
  console.log('cron job stopped')
  task.start()
}



const mongoUrl = `mongodb+srv://itai_rozen:${process.env.MONGO_PASS}@cluster0.sihrb.mongodb.net/${process.env.DB}?retryWrites=true&w=majority`
app.listen(process.env.PORT, () => {
  mongoose.connect(mongoUrl, () => {
    console.log('mongo & server connected')
    task = cron.schedule('* * * * *', () => {
      handleRecipientStack()
      setTimeout(stopAndRestartTask, 58 * 1000)
    })
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