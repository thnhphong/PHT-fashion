import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import { CartProvider } from './context/CartContext'
import App from './App.js'
import React from 'react'
import { setupAxiosInterceptors } from './utils/userService'

setupAxiosInterceptors()

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </React.StrictMode>
)
