import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './core/auth/AuthContext'
import { DatabaseProvider } from './db/provider'
import { StoreProvider } from './core/store/store'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DatabaseProvider>
          <StoreProvider>
            <App />
          </StoreProvider>
        </DatabaseProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
