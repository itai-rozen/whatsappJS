const express = require('express')
const app = express()
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const webhookPath = 'eo10srzjlhzmr5l.m.pipedream.net'
const axios = require('axios')
app.use(express.json())
app.use(express.urlencoded({extended: true}))

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
  // for (let i =0; i < 5; i++){
  //     console.log(contacts[i])
  //   }

    // const manmanit = contacts.find(contact => contact.id._serialized.includes('524390666'))
    // client.sendMessage(manmanit.id._serialized, 'hey baby')
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

client.initialize();

client.on('message', async message => {
  const from = message._data.from.replace(/\D/g, '');
  const content = message.body.split('').reverse().join('')
  // if(message.hasMedia) {
  //   try {
  //     const media = await message.downloadMedia();
  //     console.log('media: ',media)
  //     image = media.data
  //   } catch(err){
  //     console.log(err)
  //   }
  const res = await axios.post(webhookPath, {
    phone: from,
    content: content
  })
  console.log('result: ',res)
// }
// add row to spreadsheet
 console.log(message.body.split('').reverse().join(''));
});

app.get('/', async (req,res) => {
  res.send('boom')
})

app.post('/', async (req,res) => {
 const { phone, message, img = undefined } = req.body
 console.log('img: ',img)
 const finalNumber = `972${phone.slice(1)}`
 const numberId = await  client.getNumberId(finalNumber)
 console.log('number id: ',numberId)
 if (numberId){
   client.sendMessage(numberId._serialized,message)
   res.send({message: 'message sent!'})
 } else res.send({message: 'phone number is not valid'})
})



app.listen(4001, () => console.log('up & running'))

