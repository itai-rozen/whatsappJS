import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './messages.css'
import { useSearchParams } from 'react-router-dom'
import AddMessage from '../../components/AddMessage/AddMessage'

const Messages = () => {
  const [messages,setMessages] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  
  const getMessages = async () => {
    try {
      const { data }  = await axios.get('http://localhost:4001/messages')
      setMessages(data)
    }catch(err){
      console.log(err)
    }
  }

  useEffect(() => {
    getMessages()
  },[])
  return <div className='messages-container'>
    {messages.map(msg => {
      return <div key={msg._id}>
       <p> {msg.phone}</p>
       <p> {msg.content}</p>
       <p> {msg.provider}</p>
        </div>
    })}
    <button onClick={() => setShowAddModal(true)}>add message</button>
    {showAddModal && <AddMessage getMessages={getMessages} setShowAddModal={setShowAddModal} />}
  </div>
}

export default Messages