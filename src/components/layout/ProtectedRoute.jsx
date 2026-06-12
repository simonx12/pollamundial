import React, { useState } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import ThemeToggle from '../ui/ThemeToggle';

const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-lg" />
        <h2>Cargando PollaMundial...</h2>
      </div>
    );
  }

  // Explicit guard check on the JWT token stored by Supabase
  let hasValidToken = false;
  try {
    const authKeys = Object.keys(localStorage).filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (authKeys.length > 0) {
      const tokenData = JSON.parse(localStorage.getItem(authKeys[0]));
      if (tokenData?.access_token) {
        // We reuse the logic: decode the JWT and check expiration
        const base64Url = tokenData.access_token.split('.')[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            window.atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
          );
          const claims = JSON.parse(jsonPayload);
          if (claims.exp && claims.exp > Math.floor(Date.now() / 1000) + 5) {
            hasValidToken = true;
          }
        }
      }
    }
  } catch (e) {
    console.error('Error in explicit guard token validation:', e);
  }

  if (!user || !hasValidToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="app-container">
      {/* Mobile header */}
      <div className="mobile-header">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <span className="logo-text">
          Polla<span>Mundial</span>
        </span>
        <ThemeToggle />
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedLayout;
