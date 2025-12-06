import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AlertsProvider } from './context/AlertsContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AlertsProvider>
      <App />
    </AlertsProvider>
  </StrictMode>
)
