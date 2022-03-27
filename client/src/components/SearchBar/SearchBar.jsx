import React, { useState, useEffect } from 'react'
import './searchBar.css'

const SearchBar = ({ messages,setMessages,getMessages }) => {
  const [isChanged, setIsChanged] = useState(false)
  const searchQueries =  () => {
    setIsChanged(true)
  }

  useEffect(() => {
    if (isChanged){
      getMessages()
      setIsChanged(false)
    }
  },[isChanged])

  return <div className="search-container">
    <label htmlFor="phone">Phone</label>
    <input type="text" id="phone" value={messages?.phoneQuery} onChange={e => setMessages({...messages, phoneQuery: e.target.value})} />
    <label htmlFor="content">Content</label>
    <input type="text" id="content" value={messages?.contentQuery} onChange={e => setMessages({...messages, contentQuery: e.target.value})} />
    <button onClick={searchQueries}>🔎</button>
  </div>
}

export default SearchBar