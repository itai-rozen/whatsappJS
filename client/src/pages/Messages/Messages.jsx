import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './messages.css'
import { useSearchParams } from 'react-router-dom'
import AddMessage from '../../components/AddMessage/AddMessage'

const Messages = () => {
  const [messages, setMessages] = useState([])
  const [historyMessages, setHistoryMessages] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)

  const getHistory = async () => {
    try {
      const { data } = await axios.get('http://localhost:4001/history')
      setHistoryMessages(data)
    } catch (err) {
      console.log(err)
    }
  }

  const getMessages = async () => {
    try {
      const { data } = await axios.get('http://localhost:4001/messages')
      setMessages(data)
    } catch (err) {
      console.log(err)
    }
  }

  const sendMessages = async () => {
    try {
      await axios.post('http://localhost:4001/messages', {})
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
  return <div className='messages-container'>

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

    <button onClick={() => setShowAddModal(true)}>add message</button>
    {showAddModal && <AddMessage getMessages={getMessages} setShowAddModal={setShowAddModal} />}
    <button onClick={sendMessages} >send messages</button>
    <Link to="/">home</Link>
  </div>
}

export default Messages