import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, Trophy, LogOut, X, BarChart3, ClipboardList, History } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar glass-panel ${isOpen ? 'open' : ''}`}>
        <button className="sidebar-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">26</div>
            <h1 className="logo-text">
              Polla<span>Mundial</span>
            </h1>
          </div>
          <p className="logo-tagline">WE ARE 26 🏆</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <Home size={20} />
            <span>Inicio</span>
          </NavLink>
          <NavLink to="/predictions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <CalendarDays size={20} />
            <span>Pronósticos</span>
          </NavLink>
          <NavLink to="/bracket" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <Trophy size={20} />
            <span>Cuadro</span>
          </NavLink>
          <NavLink to="/results" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <ClipboardList size={20} />
            <span>Resultados</span>
          </NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <Trophy size={20} />
            <span>Ranking</span>
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <BarChart3 size={20} />
            <span>Simulador</span>
          </NavLink>
          <NavLink to="/audit" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <History size={20} />
            <span>Auditoría</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-theme">
            <ThemeToggle />
          </div>
          {profile && (
            <div className="sidebar-user">
              <div className="user-avatar">
                {profile.username?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="user-info">
                <span className="user-name">{profile.username}</span>
                <span className="user-bet">
                  Apuesta: $20,000
                </span>
              </div>
            </div>
          )}
          <button className="nav-item logout-btn" onClick={handleSignOut}>
            <LogOut size={20} />
            <span>Salir</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
