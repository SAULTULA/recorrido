import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './variables.css';

// Registro de Service Worker para PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('PWA Service Worker registrado con éxito:', reg.scope);
      })
      .catch((err) => {
        console.warn('Error al registrar Service Worker:', err);
      });
  });
}

// Captura única centralizada del prompt de instalación PWA
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).__pwaPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
