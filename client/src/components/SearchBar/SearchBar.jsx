import React, { useState } from 'react'
import axios from 'axios'
import './searchBar.css'

const SearchBar = ({ collection, partialPhone,setPartialPhone,partialContent,setPartialContent }) => {

  const searchQueries = async () => {
    try {
      const res = await axios.post('/search', { phone: partialPhone, content: partialContent, collection }  )
      
    } catch(err){
      console.log(err)
    }
  }

  return <div className="search-container">
    <label htmlFor="phone">Phone</label>
    <input type="text" id="phone" value={partialPhone} onChange={e => setPartialPhone(e.target.value)} />
    <label htmlFor="content">Content</label>
    <input type="text" id="content" value={partialContent} onChange={e => setPartialContent(e.target.value)} />
    <button onClick={searchQueries}>🔎</button>
  </div>
}

export default SearchBar