const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true
  },
  content : {
    type: String
  },
  isSent : {
    type: Boolean,
    default: false
  }
})

const Message = mongoose.model('Message', messageSchema)

module.exports = Message