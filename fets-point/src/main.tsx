import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/fets-enhancements.css'
import './styles/seven-day-calendar.css'
import './styles/bold-sidebar.css'

// Get root element with proper error handling
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error(
    'Failed to find the root element. ' +
    'Make sure there is a <div id="root"></div> in your HTML file.'
  )
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)