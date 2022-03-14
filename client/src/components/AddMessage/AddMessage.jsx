import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './addMessage.css'

const AddMessage = ({ setShowAddModal, getMessages }) => {
  const [phone, setPhone] = useState('')
  const [content, setContent] = useState('')
  const [provider, setProvider] = useState('')

  const createMessage = async e => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:4001/newMsg', {
        phone,
        content, 
        provider
      })
      setShowAddModal(false)
      getMessages()
    } catch(err){
      console.dir(err)
    }
  }

  return <div className='add-form-container'>
    <form className='add-form' onSubmit={e => createMessage(e)}>
      <button onClick={() => setShowAddModal(true)}>X</button>
      <label htmlFor="phone">phone</label>
      <input type="text" id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
      <label htmlFor="">content</label>
      <input type="text" id="content" value={content} onChange={e => setContent(e.target.value)} />
      <label htmlFor="">provider</label>
      <input type="text" id="provider" value={provider} onChange={e => setProvider(e.target.value)} />
      <input type="submit" value="add" />
    </form>
  </div>
}

export default AddMessage