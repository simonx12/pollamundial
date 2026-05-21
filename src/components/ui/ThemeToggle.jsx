import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label="Toggle theme"
    >
      <div className={`toggle-track ${theme}`}>
        <div className="toggle-thumb">
          {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
