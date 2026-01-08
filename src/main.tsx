import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App.tsx'
import  store  from './store.ts'
import { Toaster } from 'sonner'
import { BrowserRouter } from 'react-router-dom'
import { initSentry } from './config/sentry.ts';
initSentry(); 

createRoot(document.getElementById('root')!).render(
  <StrictMode>
     <Provider store={store}>
    <BrowserRouter>
     <Toaster richColors position="top-right" />
      <App />
    </BrowserRouter>
     </Provider>
  </StrictMode>,
)
