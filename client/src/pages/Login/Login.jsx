import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import io from 'socket.io-client'
import axios from 'axios';
import './login.css'
import Spinner from '../../components/Spinner/Spinner';

const Login = () => {

  const [imgSrc, setImgSrc] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const socket = io('http://localhost:4001')

  socket.on('getQr', data => {
    setImgSrc(data)
    setIsLoading(false)
  })

  socket.on('connectUser', data => {
    setIsConnected(data)
  })

  const connect = async () => {
    setIsLoading(true)
    try {
      await axios.get('/connect')

    } catch (err) {
      console.log(err)
      setIsLoading(false)
    }
  }

  const disconnect = async () => {
    try {
      await axios.get('/disconnect')
      setImgSrc('')
    } catch (err) {
      console.log(err)
    }
  }

  const checkIsConnected = async () => {
    try {
      const { data } = await axios.get('/is-connected')
      console.log('is user connected? ', data)
      setIsConnected(data)
    }catch(err){
      console.log(err)
    }
  }

  useEffect(() => {
    checkIsConnected()
  },[])

  return <div className='login-container'>
    <div className="container">
      <div className="img-container">
        <img src={imgSrc} />
      </div>
      <div className="btn-container">
        <button className='connect-btn' disabled={isConnected} onClick={connect} >Connect</button>
        <button className='connect-btn' disabled={!isConnected} onClick={disconnect}>Disconnect</button>
      </div>
      {isLoading && <Spinner />}
      {isConnected && <Link to="/messages">your messages</Link>}
    </div>
  </div>
}

export default Login