import React, { useState } from 'react'
import axios from 'axios'
import './loginUser.css'

const LoginUser = ({ url, setIsApproved, setToken}) => {
  const [password, setPassword]  = useState('')

  const login = async () => {
    try {
      const res = await axios.post(`${url}/api/login`, {password})
      if(res.data?.tokenstring){
        localStorage.setItem('wweb-access-token', JSON.stringify(res.data.tokenstring))
        setIsApproved(true)
        setToken(res.data.tokenstring)
      }
    }catch(err){
      console.log(err)
    }
  }



  return <div className='login-container'>
    <h1>Login</h1>
    <div className="login">
      <label htmlFor="password">Password</label>
      <input type="password" name="password" id="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={login}>login</button>
    </div>
  </div>
}

export default LoginUser