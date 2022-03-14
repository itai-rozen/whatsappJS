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
      console.log(qrCodeData); // show data used to generate QR Code
      qrcode.toDataURL(qrCodeData, (err, src) => {
        qrImgSrc = src
      })
      await wbm.waitQRCode();
      // waitQRCode() is necessary when qrCodeData is true
      // ...
      isAuthenticated = true
      await wbm.end();
      res.send({auth: isAuthenticated})
    }).catch(err =>  console.log(err));


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

app.post('/newMsg', async (req, res) => {
  const { body } = req
  try {
    const message = new Message(body)
    await message.save()
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