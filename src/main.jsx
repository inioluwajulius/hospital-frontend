import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TenantProvider } from './contexts/TenantProvider'
import { CurrencyProvider } from './contexts/CurrencyContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TenantProvider>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </TenantProvider>
  </StrictMode>,
)
