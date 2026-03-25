import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import './App.css'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import App from './App.js'
import React from 'react'
import { setupAxiosInterceptors } from './utils/userService'

setupAxiosInterceptors()

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
)
