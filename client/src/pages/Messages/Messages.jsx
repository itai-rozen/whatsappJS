import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import io from 'socket.io-client'
import './messages.css'
import AddMessage from '../../components/AddMessage/AddMessage'

const Messages = () => {
  const [messages, setMessages] = useState([])
  const [historyMessages, setHistoryMessages] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)

  const socket = io()

  socket.on('messageQue', data => {
    setMessages(data)
  })

  socket.on('historyQue', data => {
    setHistoryMessages(data)
  })

  const getHistory = async () => {
    try {
      const { data } = await axios.get('/history')
      setHistoryMessages(data)
    } catch (err) {
      console.log(err)
    }
  }

  const getMessages = async () => {
    try {
      const { data } = await axios.get('/messages')
      setMessages(data)
    } catch (err) {
      console.log(err)
    }
  }

  const sendMessages = async () => {
    try {
      const res = await axios.post('/messages', {})
      console.log(res)
      getMessages()
      getHistory()
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    getMessages()
    getHistory()
  }, [])
  return <>
  <div className={`messages-container ${showAddModal && 'blur'}`}>

    <div className="all-messages">
      <div className="messages que">
        <h2>Messages que</h2>
        <div className="headers">
        <p>Phone</p>
        <p>Content</p>
        <p>Provider</p>
      </div>
        {messages.map(msg => {
          return <div className='message' key={msg._id}>
            <p> {msg.phone}</p>
            <p> {msg.content}</p>
            <p> {msg.provider}</p>
          </div>
        })}
      </div>
      <div className="history que">
      <h2>History que</h2>
      <div className="headers">
        <p>Phone</p>
        <p>Content</p>
        <p>Provider</p>
        <p>Crash Log</p>
      </div>
        {historyMessages.map(msg => {
          return <div className='message' key={msg._id}>
            <p> {msg.phone}</p>
            <p> {msg.content}</p>
            <p> {msg.provider}</p>
            <p> {msg.crash_log || " "}</p>
          </div>
        })}
      </div>
    </div>
    <div className="btn-container">
    <button onClick={() => setShowAddModal(true)}>add message</button>
    <button onClick={sendMessages} >send messages</button>
    <Link to="/">home</Link>
    </div>
  </div>
    {showAddModal &&  <AddMessage getMessages={getMessages} setShowAddModal={setShowAddModal} /> }
  </> 

}

export default Messages