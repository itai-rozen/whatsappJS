import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import './loginUser.css'

const LoginUser = ({ setIsApproved }) => {
  const [password, setPassword]  = useState('')

  const login = () => {
    try {
      const res = await axios.post('/login', {password})
      
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