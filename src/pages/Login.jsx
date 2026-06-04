import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ui/ThemeToggle';
import './Login.css';

const Login = () => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          setError('Ingresa un nombre de usuario');
          setLoading(false);
          return;
        }
        await signUp(email, password, username);
        setSuccess('¡Cuenta creada! Revisa tu correo para confirmar.');
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      const messages = {
        'Invalid login credentials': 'Correo o contraseña incorrectos',
        'User already registered': 'Este correo ya está registrado',
        'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
        'Unable to validate email address: invalid format': 'Formato de correo inválido',
        'Email not confirmed': 'Debes confirmar tu correo electrónico. Revisa tu bandeja de entrada o carpeta de spam.',
        'Signup requires email verification': 'Registro exitoso. Revisa tu correo para confirmar la cuenta.',
        'Signup rate limit exceeded': 'Límite de registros superado. Por favor, espera unos minutos e intenta de nuevo.',
        'Over email send rate limit': 'Límite de envío de correos superado. Por favor, intenta de nuevo en unos minutos.',
        'Email rate limit exceeded': 'Límite de envío de correos superado. Por favor, intenta de nuevo en unos minutos.'
      };
      // Traducir mensajes comunes de Supabase si contienen palabras clave
      let errorMsg = err.message || '';
      if (errorMsg.includes('Email rate limit') || errorMsg.includes('rate limit')) {
        errorMsg = 'Límite de solicitudes superado. Por favor, intenta de nuevo en unos minutos.';
      } else if (errorMsg.includes('confirm')) {
        errorMsg = 'Debes confirmar tu correo electrónico para poder entrar. Revisa tu spam.';
      } else {
        errorMsg = messages[errorMsg] || errorMsg;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>
      
      <div className="login-card glass-panel">
        <div className="login-logo">
          <div className="logo-icon">⚽</div>
          <h1>
            Polla<span>Mundial</span>
          </h1>
        </div>
        <p className="login-subtitle">
          {isSignUp
            ? 'Crea tu cuenta y empieza a demostrar cuánto sabes de fútbol.'
            : 'Inicia sesión para ver tus pronósticos y el ranking.'}
        </p>

        {error && <div className="login-error">{error}</div>}
        {success && <div className="login-success">{success}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="input-group">
              <label htmlFor="username">
                <User size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                Nombre de usuario
              </label>
              <input
                id="username"
                type="text"
                className="input-field"
                placeholder="ej: simon_crack"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">
              <Mail size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">
              <Lock size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={loading}
          >
            {loading ? (
              <Loader size={20} className="spin-icon" />
            ) : (
              <>
                {isSignUp ? 'Crear cuenta' : 'Entrar'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-switch">
          {isSignUp ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}>
            {isSignUp ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="login-decoration login-decoration-1">⚽</div>
      <div className="login-decoration login-decoration-2">🏆</div>
      <div className="login-decoration login-decoration-3">🥅</div>
    </div>
  );
};

export default Login;
