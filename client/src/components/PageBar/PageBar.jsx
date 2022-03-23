import React, { useState, useEffect } from 'react'
import './pageBar.css'


const PageBar = ({ messages, setMessages, getMessages }) => {

  const [isChanged, setIsChanged] = useState(false)
  const updatePage =  direction => {
    const newPage = messages.currPage + direction
    setMessages({...messages, currPage: newPage})
    setIsChanged(true)
  }

  useEffect(() => {
    if (isChanged) { 
      getMessages()
      setIsChanged(false)
    }
  },[isChanged])

  return <div className="pages-container">
    <button disabled={messages.currPage === 1} onClick={() => updatePage(-1)}>&lt;&lt;</button>
    <p>{messages.currPage} of {messages.pages}</p>
    <button disabled={messages.currPage === messages.pages} onClick={() => updatePage(1)}>&gt;&gt;</button>
  </div>
}

export default PageBar