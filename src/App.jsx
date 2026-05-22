import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Predictions from './pages/Predictions';
import Bracket from './pages/Bracket';
import Leaderboard from './pages/Leaderboard';
import StandingsAnalysis from './pages/StandingsAnalysis';
import Login from './pages/Login';
import ThemeToggle from './components/ui/ThemeToggle';

function App() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Loading screen
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-lg" />
        <h2>Cargando PollaMundial...</h2>
      </div>
    );
  }

  // Not authenticated — show login
  if (!user) {
    return <Login />;
  }

  return (
    <Router>
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
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/bracket" element={<Bracket />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/analytics" element={<StandingsAnalysis />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
