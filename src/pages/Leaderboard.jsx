import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Trophy, Medal, Target, TrendingUp, Activity, X, ClipboardList, Search, RefreshCw } from 'lucide-react';
import { getLeaderboard, getAllMatchResults } from '../lib/supabase';
import { generateGroupMatches, generateKnockoutMatches } from '../lib/worldcupData';
import { useAuth } from '../context/AuthContext';
import './Pages.css';

const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds for leaderboard

const Leaderboard = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [secondsAgo, setSecondsAgo] = useState(null);

  // Resultados reales
  const [realResults, setRealResults] = useState([]);

  const intervalRef = useRef(null);
  const tickRef = useRef(null);

  // Partidos estáticos de referencia
  const allMatches = useMemo(() => {
    return [
      ...generateGroupMatches(),
      ...generateKnockoutMatches(),
    ];
  }, []);

  const matchMap = useMemo(() => {
    const map = {};
    allMatches.forEach((m) => (map[m.id] = m));
    return map;
  }, [allMatches]);

  const loadLeaderboard = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getLeaderboard();
      setPlayers(data || []);
      setLastRefresh(Date.now());
      
      // Cargar resultados reales
      const results = await getAllMatchResults().catch(() => []);
      setRealResults(results || []);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadLeaderboard(true);
  }, [loadLeaderboard]);

  // Auto-refresh every 30s
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadLeaderboard(false);
    }, AUTO_REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadLeaderboard]);

  // Seconds ago ticker
  useEffect(() => {
    tickRef.current = setInterval(() => {
      if (lastRefresh) {
        setSecondsAgo(Math.floor((Date.now() - lastRefresh) / 1000));
      }
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [lastRefresh]);

  const resultMap = useMemo(() => {
    const map = {};
    realResults.forEach((r) => (map[r.match_id] = r));
    return map;
  }, [realResults]);

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return players;
    const q = searchQuery.toLowerCase();
    return players.filter((p) => p.username?.toLowerCase().includes(q));
  }, [players, searchQuery]);

  const totalPot = players.length * 20000;
  const top3 = players.slice(0, 3);

  const formatSecondsAgo = (s) => {
    if (s === null) return '';
    if (s < 5) return 'ahora';
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    return `${m}min`;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-screen" style={{ minHeight: '50vh' }}>
          <div className="spinner spinner-lg" />
          <h2>Cargando ranking...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1><span className="gradient-text">Ranking Global</span> 🏆</h1>
          <p className="subtitle">
            Mira quién lidera la polla mundialista y explora las predicciones de tus rivales.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {secondsAgo !== null && (
            <span style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Actualizado {formatSecondsAgo(secondsAgo)}
            </span>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => loadLeaderboard(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px' }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      {/* Total pot */}
      <div className="glass-panel animate-in stagger-1" style={{ padding: '1.5rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          💰 Pozo Total Acumulado
        </span>
        <div style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          background: 'linear-gradient(90deg, var(--accent), var(--primary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2,
        }}>
          ${totalPot.toLocaleString()} COP
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {players.length} participantes
        </span>
      </div>

      {/* Podium */}
      {top3.length >= 3 && (
        <div className="glass-panel animate-in stagger-2">
          <div className="podium">
            {/* 2nd place */}
            <div className="podium-item second">
              <span className="podium-medal">🥈</span>
              <div className="podium-avatar">
                {top3[1].username?.charAt(0).toUpperCase()}
              </div>
              <span className="podium-name">{top3[1].username}</span>
              <span className="podium-points">{top3[1].total_points} pts</span>
            </div>

            {/* 1st place */}
            <div className="podium-item first">
              <span className="podium-medal">🥇</span>
              <div className="podium-avatar">
                {top3[0].username?.charAt(0).toUpperCase()}
              </div>
              <span className="podium-name">{top3[0].username}</span>
              <span className="podium-points">{top3[0].total_points} pts</span>
            </div>

            {/* 3rd place */}
            <div className="podium-item third">
              <span className="podium-medal">🥉</span>
              <div className="podium-avatar">
                {top3[2].username?.charAt(0).toUpperCase()}
              </div>
              <span className="podium-name">{top3[2].username}</span>
              <span className="podium-points">{top3[2].total_points} pts</span>
            </div>
          </div>
        </div>
      )}

      {/* Full table */}
      <div className="glass-panel section-panel animate-in stagger-3">
        <div className="section-header" style={{ gap: '1rem' }}>
          <div>
            <h2>
              <Medal size={20} style={{ verticalAlign: '-3px', marginRight: '6px' }} />
              Tabla Completa
            </h2>
          </div>
          
          {/* Search bar inside Leaderboard */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '240px' }}>
            <Search size={14} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }} />
            <input
              type="text"
              className="input-field"
              placeholder="Buscar rival..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '32px',
                paddingTop: '6px',
                paddingBottom: '6px',
                fontSize: '0.85rem',
                borderRadius: '8px'
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Jugador</th>
                <th style={{ textAlign: 'center' }}>
                  <Target size={12} style={{ verticalAlign: '-1px', marginRight: '4px' }} /> Exactos
                </th>
                <th style={{ textAlign: 'center' }}>
                  <Activity size={12} style={{ verticalAlign: '-1px', marginRight: '4px' }} /> Dif. Goles
                </th>
                <th style={{ textAlign: 'center' }}>
                  <TrendingUp size={12} style={{ verticalAlign: '-1px', marginRight: '4px' }} /> Ganador
                </th>
                <th style={{ textAlign: 'right' }}>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player, index) => {
                const isCurrentUser = player.id === user?.id;
                return (
                  <tr
                    key={player.id}
                    style={{
                      borderLeft: isCurrentUser ? '4px solid var(--primary)' : 'none',
                      background: isCurrentUser ? 'rgba(0, 240, 255, 0.06)' : ''
                    }}
                  >
                    <td>
                      <span className={`rank-cell ${index < 3 ? `rank-${index + 1}` : ''}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td>
                      <div className="player-cell">
                        <div className="player-avatar" style={{
                          background: isCurrentUser ? 'linear-gradient(135deg, var(--primary), var(--accent))' : ''
                        }}>
                          {player.username?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: isCurrentUser ? 700 : 600 }}>
                          {player.username}
                          {isCurrentUser && (
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: 'var(--primary)',
                              color: 'var(--text-inverse)',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              textTransform: 'uppercase'
                            }}>
                              Tú
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="detail-cell">{player.exact_hits}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="detail-cell">{player.diff_hits}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="detail-cell">{player.winner_hits}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="points-cell" style={{
                        color: isCurrentUser ? 'var(--primary)' : ''
                      }}>{player.total_points}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPlayers.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">🏟️</span>
            <h3>No se encontraron jugadores</h3>
            <p>Prueba buscando otro nombre de usuario.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
