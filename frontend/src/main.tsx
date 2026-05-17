import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import axios from 'axios'

// --- GLOBAL AUTH INTERCEPTORS ---
// Axios
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('crm-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Fetch wrapper
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  const token = localStorage.getItem('crm-token');
  if (token && resource.toString().startsWith(`/api/`)) {
    config = config || {};
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  }
  return originalFetch(resource, config);
};
// --------------------------------

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
