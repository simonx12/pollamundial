import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Trophy, Medal, Target, TrendingUp, X, Eye, ClipboardList, Search, RefreshCw } from 'lucide-react';
import { getLeaderboard, getUserPredictions, getAllMatchResults } from '../lib/supabase';
import { generateGroupMatches, generateKnockoutMatches, calculateMatchPoints, getMatchMultiplier } from '../lib/worldcupData';
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

  // Estados para ver predicciones de otros jugadores
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedPredictions, setSelectedPredictions] = useState([]);
  const [realResults, setRealResults] = useState([]);
  const [loadingPreds, setLoadingPreds] = useState(false);

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

  const handleViewUserPredictions = async (player) => {
    setSelectedPlayer(player);
    setLoadingPreds(true);
    try {
      const preds = await getUserPredictions(player.id).catch(() => []);
      setSelectedPredictions(preds || []);
    } catch (err) {
      console.error('Error loading user predictions:', err);
    } finally {
      setLoadingPreds(false);
    }
  };

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
          <h1>Ranking Global 🏆</h1>
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
            <div className="podium-item second" style={{ cursor: 'pointer' }} onClick={() => handleViewUserPredictions(top3[1])}>
              <span className="podium-medal">🥈</span>
              <div className="podium-avatar">
                {top3[1].username?.charAt(0).toUpperCase()}
              </div>
              <span className="podium-name">{top3[1].username}</span>
              <span className="podium-points">{top3[1].total_points} pts</span>
            </div>

            {/* 1st place */}
            <div className="podium-item first" style={{ cursor: 'pointer' }} onClick={() => handleViewUserPredictions(top3[0])}>
              <span className="podium-medal">🥇</span>
              <div className="podium-avatar">
                {top3[0].username?.charAt(0).toUpperCase()}
              </div>
              <span className="podium-name">{top3[0].username}</span>
              <span className="podium-points">{top3[0].total_points} pts</span>
            </div>

            {/* 3rd place */}
            <div className="podium-item third" style={{ cursor: 'pointer' }} onClick={() => handleViewUserPredictions(top3[2])}>
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
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              💡 Haz clic en cualquier jugador para ver sus pronósticos
            </span>
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
                  <Target size={12} style={{ verticalAlign: '-1px' }} /> Exactos
                </th>
                <th style={{ textAlign: 'center' }}>
                  <TrendingUp size={12} style={{ verticalAlign: '-1px' }} /> Ganador
                </th>
                <th style={{ textAlign: 'center' }}>Detalle</th>
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
                      cursor: 'pointer',
                      borderLeft: isCurrentUser ? '4px solid var(--primary)' : 'none',
                      background: isCurrentUser ? 'rgba(0, 240, 255, 0.06)' : ''
                    }}
                    onClick={() => handleViewUserPredictions(player)}
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
                      <span className="detail-cell">{player.winner_hits}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-sm btn-secondary" style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={12} /> Ver
                      </button>
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

      {/* MODAL PARA MOSTRAR DETALLE DE PRONÓSTICOS */}
      {selectedPlayer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1.5rem',
        }} onClick={() => setSelectedPlayer(null)}>
          <div className="glass-panel animate-in" style={{
            width: '100%',
            maxWidth: '650px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header del Modal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--panel-hover)',
              background: 'var(--panel-hover)',
            }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚽ Pronósticos de {selectedPlayer.username}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Total: {selectedPlayer.total_points} pts · Exactos: {selectedPlayer.exact_hits} · Aciertos: {selectedPlayer.winner_hits}
                </p>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '6px', borderRadius: '50%' }}
                onClick={() => setSelectedPlayer(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Lista de Pronósticos */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}>
              {loadingPreds ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '10px' }}>
                  <div className="spinner" />
                  <span>Cargando pronósticos...</span>
                </div>
              ) : selectedPredictions.length === 0 ? (
                <div className="empty-state" style={{ minHeight: '200px' }}>
                  <span style={{ fontSize: '2.5rem' }}>📄</span>
                  <p>Este usuario aún no ha guardado ningún pronóstico.</p>
                </div>
              ) : (
                selectedPredictions.map((pred) => {
                  const match = matchMap[pred.match_id];
                  if (!match) return null;

                  const result = resultMap[pred.match_id];
                  const hasResult = !!result;

                  // Calcular puntos locales
                  const multiplier = getMatchMultiplier(pred.match_id);
                  let pts = 0;
                  if (hasResult) {
                    pts = calculateMatchPoints(
                      pred.match_id,
                      pred.home_score,
                      pred.away_score,
                      result.home_score,
                      result.away_score
                    );
                  }

                  const getPointsLabel = () => {
                    if (pts === 5 * multiplier) return `¡Exacto! +${5 * multiplier} pts`;
                    if (pts === 3 * multiplier) return `Diferencia +${3 * multiplier} pts`;
                    if (pts === 1 * multiplier) return `Ganador +${1 * multiplier} pt${multiplier > 1 ? 's' : ''}`;
                    return '0 pts';
                  };

                  return (
                    <div
                      key={pred.id}
                      style={{
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--panel-hover)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      {/* Cabecera del partido */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>{match.group}</span>
                        {hasResult ? (
                          <span style={{
                            fontWeight: 700,
                            color: pts === 5 * multiplier ? 'var(--accent)' : pts === 3 * multiplier ? 'var(--secondary)' : pts === 1 * multiplier ? 'var(--primary)' : 'var(--text-muted)',
                            background: pts === 5 * multiplier ? 'rgba(16, 185, 129, 0.15)' : pts === 3 * multiplier ? 'rgba(245, 158, 11, 0.15)' : pts === 1 * multiplier ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.05)',
                            padding: '2px 8px',
                            borderRadius: '20px',
                          }}>
                            {getPointsLabel()}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Pendiente</span>
                        )}
                      </div>

                      {/* Marcadores */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {/* Equipo local */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <span>{match.homeFlag}</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{match.homeTeam}</span>
                        </div>

                        {/* Comparación de marcadores */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '0 1rem' }}>
                          {/* Predicción */}
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Pronóstico: {pred.home_score} - {pred.away_score}
                          </div>
                          {/* Real */}
                          {hasResult && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>
                              Real: {result.home_score} - {result.away_score}
                            </div>
                          )}
                        </div>

                        {/* Equipo visitante */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{match.awayTeam}</span>
                          <span>{match.awayFlag}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
