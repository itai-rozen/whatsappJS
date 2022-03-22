const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true
  },
  content : {
    type: String
  },
  provider : {
    type: String,
    requires: true
  }
},{ timestamps: true })

const Message = mongoose.model('Message', messageSchema)

module.exports = Message