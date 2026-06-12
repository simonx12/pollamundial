import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { syncLiveResultsToSupabase } from './lib/footballApi';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Predictions from './pages/Predictions';
import Bracket from './pages/Bracket';
import Leaderboard from './pages/Leaderboard';
import StandingsAnalysis from './pages/StandingsAnalysis';
import Results from './pages/Results';
import AuditLogs from './pages/AuditLogs';
import Login from './pages/Login';
import ThemeToggle from './components/ui/ThemeToggle';

import ProtectedRoute from './components/layout/ProtectedRoute';

function App() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      // Sincronización automática en segundo plano al cargar el sitio (con throttle de 2 min)
      syncLiveResultsToSupabase(false).catch((err) =>
        console.error('App background results sync error:', err)
      );
    }
  }, [user]);

  // Main layout wrapper for protected routes
  const ProtectedLayout = ({ children }) => (
    <ProtectedRoute>
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
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" replace /> : <Login />
        } />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/predictions" element={<ProtectedLayout><Predictions /></ProtectedLayout>} />
        <Route path="/bracket" element={<ProtectedLayout><Bracket /></ProtectedLayout>} />
        <Route path="/results" element={<ProtectedLayout><Results /></ProtectedLayout>} />
        <Route path="/leaderboard" element={<ProtectedLayout><Leaderboard /></ProtectedLayout>} />
        <Route path="/analytics" element={<ProtectedLayout><StandingsAnalysis /></ProtectedLayout>} />
        <Route path="/audit" element={<ProtectedLayout><AuditLogs /></ProtectedLayout>} />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
