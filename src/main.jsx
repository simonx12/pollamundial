import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import App from './App.jsx';
import './index.css';

// Registro del Service Worker para limpiar cachés (se auto-destruye)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('SW Cache Cleaner registered.');
    });

    // Desregistrar activamente cualquier otro SW
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (let registration of registrations) {
        if (registration.active?.scriptURL && !registration.active.scriptURL.includes('sw.js')) {
          registration.unregister();
        }
      }
    });
  });
}

// Limpiar caches del navegador y SessionStorage que puedan estar bloqueando Auth
if ('caches' in window) {
  caches.keys().then((names) => {
    names.forEach((name) => caches.delete(name));
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
