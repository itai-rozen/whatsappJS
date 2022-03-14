const mongoose = require('mongoose')

const historySchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true
  },
  content : {
    type: String
  },
  provider : {
    type: String,
    required: true
  },
  crash_log : {
    type: String,
    default: ''
  }

})

const History = mongoose.model('History', historySchema)

module.exports = History