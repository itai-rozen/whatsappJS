import React, { useState } from 'react'
import axios from 'axios'
import moment from 'moment'
import './cron.css'

const Cron = ({ socket }) => {

  const [isCronRunning, setIsCronRunning] = useState(true)
  const [lastCronDateTime, setLastCronDateTime] = useState('no available data')

  socket.on('cronDate', cronDate => {
    const dateStr = moment(cronDate).format('D/M h:mma')
    setLastCronDateTime(dateStr)
  })
  const controlCronJob = async command => {
    try {
      const res = await axios.get(`/${command}-cron`)
      setIsCronRunning(command === 'start')
    } catch (err) {
      console.log(err)
    }
  }

  return <div className='cron-container'>
    <h4>Cron job controller</h4>
    <p>current status: {isCronRunning ? <span>Running</span> : <span>Not running</span> }</p>
    <button title='start cron job' onClick={() => controlCronJob('start')}>▶️</button>
    <button title='stop cron job' onClick={() => controlCronJob('stop')}>⏹️</button>
    <p>last cron job: {lastCronDateTime} </p>  
  </div>
}

export default Cron