import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css';
import Login from './pages/Login/Login';
import Messages from './pages/Messages/Messages';
function App() {

  const url = process.env.NODE_ENV === 'production' ?
                                       '/':
                                       'http://localhost:4001'
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login url={url} />} />
          <Route path="/messages" element={<Messages url={url} />} />
        </Routes>
      </BrowserRouter>

    </div>
  );
}

export default App;
