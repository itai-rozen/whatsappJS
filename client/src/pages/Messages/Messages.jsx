import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import moment from 'moment'
import './messages.css'
import AddMessage from '../../components/AddMessage/AddMessage'
import Cron from '../../components/Cron/Cron'
import SearchBar from '../../components/SearchBar/SearchBar'
import PageBar from '../../components/PageBar/PageBar'
import Spinner from '../../components/Spinner/Spinner'

const Messages = ({ socket, token }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState({
    messages: [],
    count: 0,
    pages: 1,
    currPage: 1,
    phoneQuery: '',
    contentQuery: ''
  })
  const [historyMessages, setHistoryMessages] = useState({
    messages: [],
    count: 0,
    pages: 1,
    currPage: 1,
    phoneQuery: '',
    contentQuery: ''
  })
  const [showAddModal, setShowAddModal] = useState(false)

  const QUERIES_PER_PAGE = 10

  socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
  });

  socket.on('messageQue', data => {
    setMessages({ ...messages, messages: data.messages, count: data.count })
  })

  socket.on('historyQue', data => {
    setHistoryMessages({ ...historyMessages, messages: data.messages, count: data.count })
  })

  const getMessages = async () => {
    try {
      const { data } = await axios
        .post('/api/messages', {
          phone: messages.phoneQuery,
          content: messages.contentQuery,
          limit: QUERIES_PER_PAGE,
          page: messages.currPage
        }, { headers: { 'Authorization': token } })
      setMessages({ ...messages, messages: data.messages, count: data.count, pages: data.pages })
    } catch (err) {
      console.log(err)
    }
  }

  const getHistory = async () => {
    setIsLoading(true)
    try {
      const { data } = await axios
        .post('/api/history', {
          phone: historyMessages.phoneQuery,
          content: historyMessages.contentQuery,
          limit: QUERIES_PER_PAGE,
          page: historyMessages.currPage
        }, { headers: { 'Authorization': token } })
      setHistoryMessages({ ...historyMessages, messages: data.messages, count: data.count, pages: data.pages })
      setIsLoading(false)
    } catch (err) {
      console.log(err)
      setIsLoading(false)
    }
  }



  const sendMessages = async () => {
    try {
      const res = await axios.post('/api/send-messages', {}, { headers: { 'Authorization': token } })
      console.log(res)
      getMessages()
      getHistory()
    } catch (err) {
      console.log(err)
    }
  }

  const deleteMessage = async id => {
    try {
      await axios.post('/api/delete-message', { id }, { headers: { 'Authorization': token } })
      getMessages()
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    getMessages()
    getHistory()
  }, [])


  return <>
    <div className={`messages-container ${showAddModal && 'blur'}`}>

      <div className="all-messages">
        <div className="messages que">
          <h2>Messages que</h2>
          <SearchBar
            messages={messages}
            setMessages={setMessages}
            getMessages={getMessages}
          />
          <div className="headers">
            <p>Phone</p>
            <p>Content</p>
            <p>Provider</p>
            <p>created at</p>
            <p></p>
          </div>
          <div className="message-list-container">

            {messages.messages?.map(msg => {
              return <div className='message' key={msg._id}>
                <p> {msg.phone}</p>
                <p> {msg.content}</p>
                <p> {msg.provider}</p>
                <p>{moment(msg.createdAt).format('d MMM h:mma')}</p>
                <p className='delete-msg' onClick={() => deleteMessage(msg._id)}> 🗑️</p>
              </div>
            })}
          </div>
          <div className="page-bar">
            <PageBar
              setMessages={setMessages}
              messages={messages}
              getMessages={getMessages}
            />
          </div>
        </div>
        <div className="history que">
          <h2>History que</h2>
          <SearchBar
            messages={historyMessages}
            setMessages={setHistoryMessages}
            getMessages={getHistory}
          />
          <div className="headers">
            <p>Phone</p>
            <p>Content</p>
            <p>Provider</p>
            <p>created at</p>
            <p>Crash Log</p>

          </div>
          <div className="message-list-container">

          {historyMessages.messages?.map(msg => {
            return <div className='message' key={msg._id}>
              <p> {msg.phone}</p>
              <p> {msg.content}</p>
              <p> {msg.provider}</p>
              <p> {msg.createdAt && moment(msg.createdAt).format('D/M h:mma')} </p>
              <p title={msg.crash_log}> {msg.crash_log.length >0 && <span className='bold'>Error -  hover for details</span> || " "}</p>
            </div>
          })}
          </div>
          <div className="page-bar">
            <PageBar
              setMessages={setHistoryMessages}
              messages={historyMessages}
              getMessages={getHistory}
            />
          </div>
        </div>

      </div>
      <div className="btn-container">
        <Cron socket={socket} token={token} />
        <button onClick={() => setShowAddModal(true)}>add message</button>
        <button onClick={sendMessages} >send messages</button>

        <Link to="/">home</Link>
      </div>
    </div>
    {showAddModal && <AddMessage getMessages={getMessages} setShowAddModal={setShowAddModal} />}
    {isLoading && <Spinner />}
  </>

}

export default Messages