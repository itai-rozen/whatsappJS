import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios';
import './login.css'

const Login = () => {

  const [imgSrc, setImgSrc] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const TRIES = 5

  const getQrCode = async () => {
    if (!imgSrc) {
      setIsLoading(true)
      try {
        const { data } = await axios.get('http://localhost:4001/qr')
        setImgSrc(data.qr)
        setIsLoading(false)
        console.log('src: ', data)
      } catch (err) {
        console.dir(err)
      }
    } else return

  }

  const tryGettingQr = async () => {
    for (let i = 1; i <= TRIES; i++) {
      await new Promise(resolve => {
        setTimeout(resolve, 2000)
        console.log('try number ', i)
        getQrCode()
      })
    }
    setIsLoading(false)
  }

  useEffect(() => {
    tryGettingQr()
  }, [])
  return <>
  {/* <button onClick={tryGettingQr}>hook a device</button> */}
  <img src={imgSrc} />
  {isLoading && <p>Loading...</p>}
  {!isLoading && <>
  <div>still not getting qr code? </div>
  <button onClick={tryGettingQr}>refresh</button>
  </>}
  <Link to="/messages">your messages</Link>
  </>
}

export default Login