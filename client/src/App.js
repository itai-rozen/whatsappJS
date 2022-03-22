import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css';
import Login from './pages/Login/Login';
import Messages from './pages/Messages/Messages';
import io from 'socket.io-client'

function App() {
  
  const url = process.env.NODE_ENV === 'production' ?
  '/':
  'http://localhost:4001'

  const socket = io(url,{
    reconnectionDelay: 1000,
    reconnection:true,
    reconnectionAttempts: 10,
    transports: ['websocket'],
    agent: false, 
    upgrade: false,
    rejectUnauthorized: false
  })

  socket.on('test', data => console.log('data:', data))

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login url={url} socket={socket} />} />
          <Route path="/dashboard" element={<Messages url={url} socket={socket} />} />
        </Routes>
      </BrowserRouter>

    </div>
  );
}

export default App;
