import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Target, TrendingUp, DollarSign, CalendarDays, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateGroupMatches } from '../lib/worldcupData';
import { getUserPredictions, getAllMatchResults, getLeaderboard, savePrediction } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import MatchCard from '../components/match/MatchCard';
import CountdownBanner from '../components/ui/CountdownBanner';
import './Pages.css';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [predictions, setPredictions] = useState([]);
  const [results, setResults] = useState([]);
  const [players, setPlayers] = useState([]);

  const allMatches = useMemo(() => generateGroupMatches(), []);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  async function loadData() {
    try {
      const [preds, res, leaders] = await Promise.all([
        getUserPredictions(user.id).catch(() => []),
        getAllMatchResults().catch(() => []),
        getLeaderboard().catch(() => []),
      ]);
      setPredictions(preds || []);
      setResults(res || []);
      setPlayers(leaders || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  }

  // Calculate stats
  const predictionMap = useMemo(() => {
    const map = {};
    predictions.forEach((p) => (map[p.match_id] = p));
    return map;
  }, [predictions]);

  const resultMap = useMemo(() => {
    const map = {};
    results.forEach((r) => (map[r.match_id] = r));
    return map;
  }, [results]);

  const totalPoints = useMemo(() => {
    return predictions.reduce((acc, p) => acc + (p.points_earned || 0), 0);
  }, [predictions]);

  const exactHits = useMemo(() => {
    return predictions.filter((p) => p.points_earned === 3).length;
  }, [predictions]);

  const winnerHits = useMemo(() => {
    return predictions.filter((p) => p.points_earned === 1).length;
  }, [predictions]);

  const top3 = useMemo(() => {
    return players.slice(0, 3);
  }, [players]);

  // Get upcoming matches (next 4)
  const upcomingMatches = useMemo(() => {
    const now = new Date();
    return allMatches
      .filter((m) => new Date(m.date) > now)
      .slice(0, 4);
  }, [allMatches]);

  const handleSavePrediction = async (matchId, homeScore, awayScore) => {
    await savePrediction(user.id, matchId, homeScore, awayScore);
    addToast('Pronóstico guardado ✓', 'success');
    loadData();
  };


  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>
            {greeting()}, {profile?.username || 'Jugador'} 👋
          </h1>
          <p className="subtitle">
            Aquí tienes el resumen de tu participación en la polla.
          </p>
        </div>
      </header>

      <CountdownBanner />

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card glass-panel animate-in stagger-1">
          <span className="stat-label">
            <Trophy size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
            Puntos Totales
          </span>
          <div className="stat-value gold">{totalPoints}</div>
          <p className="stat-desc">{predictions.length} pronósticos realizados</p>
        </div>
        <div className="stat-card glass-panel animate-in stagger-2">
          <span className="stat-label">
            <Target size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
            Exactos
          </span>
          <div className="stat-value green">{exactHits}</div>
          <p className="stat-desc">+3 puntos cada uno</p>
        </div>
        <div className="stat-card glass-panel animate-in stagger-3">
          <span className="stat-label">
            <TrendingUp size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
            Ganador Acertado
          </span>
          <div className="stat-value blue">{winnerHits}</div>
          <p className="stat-desc">+1 punto cada uno</p>
        </div>
      </div>

      {/* Top 3 Podium Section */}
      {top3.length >= 3 && (
        <div className="glass-panel animate-in stagger-4" style={{ padding: '1.5rem' }}>
          <div className="section-header" style={{ marginBottom: '0.75rem' }}>
            <h2>🏆 Líderes de la Polla</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/leaderboard')}>
              Ver Ranking Completo <ArrowRight size={14} />
            </button>
          </div>
          <div className="podium" style={{ padding: '1rem 0 0' }}>
            {/* 2nd place */}
            <div className="podium-item second" style={{ cursor: 'pointer' }} onClick={() => navigate('/leaderboard')}>
              <span className="podium-medal">🥈</span>
              <div className="podium-avatar">
                {top3[1].username?.charAt(0).toUpperCase()}
              </div>
              <span className="podium-name">{top3[1].username}</span>
              <span className="podium-points">{top3[1].total_points} pts</span>
            </div>

            {/* 1st place */}
            <div className="podium-item first" style={{ cursor: 'pointer' }} onClick={() => navigate('/leaderboard')}>
              <span className="podium-medal">🥇</span>
              <div className="podium-avatar">
                {top3[0].username?.charAt(0).toUpperCase()}
              </div>
              <span className="podium-name">{top3[0].username}</span>
              <span className="podium-points">{top3[0].total_points} pts</span>
            </div>

            {/* 3rd place */}
            <div className="podium-item third" style={{ cursor: 'pointer' }} onClick={() => navigate('/leaderboard')}>
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

      {/* Bet amount (Fixed) */}
      <div className="bet-section glass-panel animate-in stagger-5">
        <div className="section-header">
          <h2>
            <DollarSign size={20} style={{ verticalAlign: '-3px', marginRight: '6px' }} />
            Apuesta de la Polla
          </h2>
        </div>
        <div className="bet-current">
          <span className="amount">$20,000</span>
          <span className="currency">COP (Valor único de inscripción)</span>
        </div>
      </div>

      {/* Upcoming matches */}
      <div className="glass-panel section-panel animate-in stagger-6">
        <div className="section-header">
          <h2>
            <CalendarDays size={20} style={{ verticalAlign: '-3px', marginRight: '6px' }} />
            Próximos Partidos
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/predictions')}>
            Ver todos <ArrowRight size={14} />
          </button>
        </div>
        {upcomingMatches.length > 0 ? (
          <div className="matches-grid">
            {upcomingMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predictionMap[match.id]}
                result={resultMap[match.id]}
                onSavePrediction={handleSavePrediction}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">🏟️</span>
            <p>No hay partidos próximos por ahora.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
