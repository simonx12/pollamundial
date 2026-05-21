import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Target, TrendingUp } from 'lucide-react';
import { getLeaderboard } from '../lib/supabase';
import './Pages.css';

const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    setLoading(true);
    try {
      const data = await getLeaderboard();
      setPlayers(data || []);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      // Demo data if Supabase not configured
      setPlayers([
        { id: '1', username: 'Simón', total_points: 45, exact_hits: 8, winner_hits: 15, bet_amount: 20000 },
        { id: '2', username: 'Carlos', total_points: 38, exact_hits: 6, winner_hits: 14, bet_amount: 20000 },
        { id: '3', username: 'María', total_points: 35, exact_hits: 5, winner_hits: 15, bet_amount: 20000 },
        { id: '4', username: 'Andrés', total_points: 32, exact_hits: 4, winner_hits: 16, bet_amount: 20000 },
        { id: '5', username: 'Laura', total_points: 28, exact_hits: 3, winner_hits: 16, bet_amount: 20000 },
        { id: '6', username: 'Diego', total_points: 25, exact_hits: 3, winner_hits: 13, bet_amount: 20000 },
        { id: '7', username: 'Valentina', total_points: 22, exact_hits: 2, winner_hits: 14, bet_amount: 20000 },
        { id: '8', username: 'Juan', total_points: 18, exact_hits: 1, winner_hits: 13, bet_amount: 20000 },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const totalPot = players.reduce((acc, p) => acc + (p.bet_amount || 0), 0);
  const top3 = players.slice(0, 3);

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
      <header className="page-header">
        <div>
          <h1>Ranking Global 🏆</h1>
          <p className="subtitle">
            Mira quién lidera la polla mundialista.
          </p>
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
        <div className="section-header">
          <h2>
            <Medal size={20} style={{ verticalAlign: '-3px', marginRight: '6px' }} />
            Tabla Completa
          </h2>
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
                <th style={{ textAlign: 'center' }}>Apuesta</th>
                <th style={{ textAlign: 'right' }}>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr key={player.id}>
                  <td>
                    <span className={`rank-cell ${index < 3 ? `rank-${index + 1}` : ''}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td>
                    <div className="player-cell">
                      <div className="player-avatar">
                        {player.username?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{player.username}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="detail-cell">{player.exact_hits}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="detail-cell">{player.winner_hits}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="detail-cell">
                      ${(player.bet_amount || 0).toLocaleString()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="points-cell">{player.total_points}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {players.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">🏟️</span>
            <p>Aún no hay participantes registrados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
