import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './addMessage.css'

const AddMessage = ({ setShowAddModal, getMessages }) => {
  const [phone, setPhone] = useState('972524390666')
  const [content, setContent] = useState('test')
  const [provider, setProvider] = useState('972506819764')

  const createMessage = async e => {
    e.preventDefault()
    try {
      await axios.post('/newMsg', {
        phone,
        content, 
        provider
      })
      getMessages()
      setShowAddModal(false)
    } catch(err){
      console.dir(err)
    }
  }

  return <div className='add-form-container'>
    <form className='add-form' onSubmit={e => createMessage(e)}>
      <button onClick={() => setShowAddModal(false)}>X</button>
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