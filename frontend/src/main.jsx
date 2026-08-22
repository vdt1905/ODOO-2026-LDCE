import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { bootDevSettings } from './lib/devSettings.js'

// Before the first paint, so a reload does not flash the default type pairing.
bootDevSettings()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
