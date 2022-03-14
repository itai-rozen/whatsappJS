const express = require('express')
const app = express()
const qrcode = require('qrcode');
const cors = require('cors')
const fs = require('fs');
const axios = require('axios')
const mongoose = require('mongoose')
const cron = require('node-cron')
const Message = require('./model/message.js')
const History = require('./model/history.js')
require('dotenv').config()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const wbm = require('wbm')
// Path where the session data will be stored

let qrImgSrc
let isAuthenticated = false


  wbm.start({ showBrowser: false, qrCodeData: true, session: true })
    .then(async qrCodeData => {
      console.log('qr: ',qrCodeData); // show data used to generate QR Code
      qrcode.toDataURL(qrCodeData, (err, src) => {
        qrImgSrc = src
      })
      await wbm.waitQRCode();
      // waitQRCode() is necessary when qrCodeData is true
      // ...
      await wbm.end();
    }).catch(err =>  console.log('error on auth: ', err));


app.get('/qr', (req, res) => {
  if (qrImgSrc) res.status(200).send({ qr: qrImgSrc })
  else res.send({ qr: '' })
})

app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find()
    res.send(messages)
  } catch (err) {
    res.status(400).send(err)
  }
})

const sendMessage = msg => {
  console.log('message: ',msg)
  wbm.start({session: false, qrCodeData: false})
  .then(async () => {
    const phone = [msg.phone]
    await wbm.send(phone, msg.content)
    await wbm.end()
  })
  .catch(err => console.log('error on sendMessage: ',err))
}

const sendMessages = async msgs => {
  console.log('messages: ',msgs)
  for (const msg of msgs){
    const randNum = Math.floor(Math.random() * 6 + 10)
    await new Promise(resolve => setTimeout(resolve, randNum * 1000))
    sendMessage(msg)
  }
}

app.post('/messages', async (req,res) => {
  console.log('POST /messages')
  const oldest30Messages = await Message.find().sort({ _id: 1 }).limit(2)
  sendMessages(oldest30Messages)
  res.end()
})

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

const mongoUrl = `mongodb+srv://itai_rozen:${process.env.MONGO_PASS}@cluster0.sihrb.mongodb.net/${process.env.DB}?retryWrites=true&w=majority`
app.listen(process.env.PORT, () => {
  mongoose.connect(mongoUrl, () => {
    console.log('mongo & server connected')
  })
})