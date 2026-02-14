import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App'
import { initApiClient } from './api/client'
import { initWebSocket } from './api/websocket'

async function bootstrap() {
  // Resolve backend URL before rendering (needed for production/file:// mode)
  await initApiClient()
  await initWebSocket()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap()
