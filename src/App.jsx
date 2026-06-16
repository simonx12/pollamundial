import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { syncLiveResultsToSupabase } from './lib/footballApi';
import Dashboard from './pages/Dashboard';
import Predictions from './pages/Predictions';
import Bracket from './pages/Bracket';
import Leaderboard from './pages/Leaderboard';
import StandingsAnalysis from './pages/StandingsAnalysis';
import Results from './pages/Results';
import AuditLogs from './pages/AuditLogs';
import Rules from './pages/Rules';
import Login from './pages/Login';

import ProtectedLayout from './components/layout/ProtectedRoute';

function App() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Sincronización automática en segundo plano al cargar el sitio (con throttle de 2 min)
      syncLiveResultsToSupabase(false).catch((err) =>
        console.error('App background results sync error:', err)
      );
    }
  }, [user]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" replace /> : <Login />
        } />
        
        {/* Protected Routes Guard */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/bracket" element={<Bracket />} />
          <Route path="/results" element={<Results />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/analytics" element={<StandingsAnalysis />} />
          <Route path="/audit" element={<AuditLogs />} />
          <Route path="/rules" element={<Rules />} />
        </Route>
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
