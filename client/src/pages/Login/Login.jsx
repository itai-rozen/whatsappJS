import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import io from 'socket.io-client'
import axios from 'axios';
import './login.css'
import Spinner from '../../components/AddMessage/Spinner/Spinner';

const Login = () => {

  const [imgSrc, setImgSrc] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const socket = io('http://localhost:4001')

  socket.on('getQr' , data => {
    setImgSrc(data)
    setIsLoading(false)
  })

  socket.on('connectUser', data => {
    setIsConnected(data)
  })
  
  const connect = async () => {
    setIsLoading(true)
    try {
      await axios.get('http://localhost:4001/connect')
    } catch(err){
      console.log(err)
      setIsLoading(false)
    }
  }

  const disconnect = async () => {
    try {
      await axios.get('http://localhost:4001/disconnect')
      setImgSrc('')
    }catch(err){
      console.log(err)
    }
  }



  useEffect(() => {
  }, [])

  return <>
  <button disabled={!isConnected} onClick={connect} >Connect</button>
  <button disabled={isConnected} onClick={disconnect}>Disconnect</button>
  <img src={imgSrc} />
  {isLoading && <Spinner />}
  {isConnected && <Link to="/messages">your messages</Link>}
  </>
}

export default Login