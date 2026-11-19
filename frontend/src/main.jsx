import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URI,
  withCredentials: true
})

export const webSocket = new WebSocket(import.meta.env.VITE_WS_BACKEND_URI)
export let sessionFolderName = null

webSocket.addEventListener('message', (event) => {
  try {
    const message = JSON.parse(event.data)
    if (message.type === 'session' && message.folderName) {
      sessionFolderName = message.folderName
    }
  } catch {
    // Other listeners handle message processing and reporting.
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
