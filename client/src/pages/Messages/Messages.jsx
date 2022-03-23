import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import moment from 'moment'
import './messages.css'
import AddMessage from '../../components/AddMessage/AddMessage'
import Cron from '../../components/Cron/Cron'

const Messages = ({ socket,token}) => {
  const [messages, setMessages] = useState([])
  const [historyMessages, setHistoryMessages] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)

  socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
  });

  socket.on('messageQue', data => {
    setMessages(data)
  })

  socket.on('historyQue', data => {
    setHistoryMessages(data)
  })

  const getHistory = async () => {
    try {
      const { data } = await axios.get('/history',{headers:{'Authorization': token}})
      setHistoryMessages(data)
    } catch (err) {
      console.log(err)
    }
  }

  const getMessages = async () => {
    try {
      const { data } = await axios.get('/messages',{headers:{'Authorization': token}})
      setMessages(data)
    } catch (err) {
      console.log(err)
    }
  }

  const sendMessages = async () => {
    try {
      const res = await axios.post('/messages', {headers:{'Authorization': token}, body: {}})
      console.log(res)
      getMessages()
      getHistory()
    } catch (err) {
      console.log(err)
    }
  }

  const deleteMessage = async id => {
    try {
      await axios.post('/delete-message', {headers:{'Authorization': token}, body:{id} })
      getMessages()
    } catch(err){
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
        <p>created at</p>
        <p></p>
      </div>
        {messages.map(msg => {
          return <div className='message' key={msg._id}>
            <p> {msg.phone}</p>
            <p> {msg.content}</p>
            <p> {msg.provider}</p>
            <p>{moment(msg.createdAt).format('d/m h:mma')}</p>
            <p className='delete-msg' onClick={() => deleteMessage(msg._id)}> 🗑️</p>
          </div>
        })}
      </div>
      <div className="history que">
      <h2>History que</h2>
      <div className="headers">
        <p>Phone</p>
        <p>Content</p>
        <p>Provider</p>
        <p>created at</p>
        <p>Crash Log</p>

      </div>
        {historyMessages.map(msg => {
          return <div className='message' key={msg._id}>
            <p> {msg.phone}</p>
            <p> {msg.content}</p>
            <p> {msg.provider}</p>
            <p> {msg.createdAt && moment(msg.createdAt).format('D/M h:mma') } </p>
            <p> {msg.crash_log || " "}</p>
          </div>
        })}
      </div>
    </div>
    <div className="btn-container">
    <Cron socket={socket} token={token} />
    <button onClick={() => setShowAddModal(true)}>add message</button>
    <button onClick={sendMessages} >send messages</button>

    <Link to="/">home</Link>
    </div>
  </div>
    {showAddModal &&  <AddMessage getMessages={getMessages} setShowAddModal={setShowAddModal} /> }
  </> 

}

export default Messages