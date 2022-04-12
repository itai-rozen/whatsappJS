import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css';
import Login from './pages/Login/Login';
import Messages from './pages/Messages/Messages';
import io from 'socket.io-client'
import LoginUser from './pages/LoginUser/LoginUser';

function App() {
  const [isApproved, setIsApproved] = useState(false)
  const [token, setToken] = useState(undefined)
  const url = process.env.NODE_ENV === 'production' ?
    '' :
    'http://localhost:4001'

  const socket = io(url, {
    reconnectionDelay: 1000,
    reconnection: true,
    reconnectionAttempts: 10,
    transports: ['websocket'],
    agent: false,
    upgrade: false,
    rejectUnauthorized: false
  })

  socket.on('test', data => console.log('data:', data))

  const checkToken = () => {
    const storageToken = JSON.parse(localStorage.getItem('wweb-access-token'))
    if (storageToken) {
      setToken(storageToken)
      setIsApproved(true)
    }
  }

  useEffect(() => {
    checkToken()
  }, [])
  return (
    <div className="App">
      {
        <BrowserRouter>
          <Routes>
            <Route path="/" element={isApproved && token ? <Login url={url} socket={socket} token={token} /> :
                                                           <LoginUser url={url} setIsApproved={setIsApproved} setToken={setToken} />} />
            <Route path="/dashboard" element={<Messages url={url} socket={socket} token={token} />} />
          </Routes>
        </BrowserRouter>
      }
    </div>
  );
}

export default App;
