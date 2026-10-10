import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { PushProvider } from './context/PushContext.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <PushProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </PushProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)