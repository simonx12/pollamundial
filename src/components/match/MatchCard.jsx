import React, { useState, useEffect } from 'react';
import { Save, Check, Clock, Zap, Lock } from 'lucide-react';
import { calculateMatchPoints, getMatchMultiplier } from '../../lib/worldcupData';
import './MatchCard.css';

const MatchCard = ({ match, prediction, onSavePrediction, disabled, result }) => {
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (prediction) {
      setHomeScore(prediction.home_score?.toString() ?? '');
      setAwayScore(prediction.away_score?.toString() ?? '');
    }
  }, [prediction]);

  const handleSave = async () => {
    if (homeScore === '' || awayScore === '') return;
    setSaving(true);
    try {
      await onSavePrediction(match.id, parseInt(homeScore), parseInt(awayScore));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving prediction:', err);
    } finally {
      setSaving(false);
    }
  };

  const matchDate = new Date(match.date);
  const deadline = new Date(matchDate.getTime() - 30 * 60000); // 30 minutes before match
  const isFinished = match.status === 'FINISHED' || result;
  const isLive = ['LIVE', 'IN_PLAY', 'PAUSED'].includes(match.status);
  const isLocked = new Date() > deadline;

  const formatDate = (date) => {
    const now = new Date();
    const diff = date - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Mañana';
    if (days === -1) return 'Ayer';
    
    return date.toLocaleDateString('es-CO', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Calculate points if match is finished
  const multiplier = getMatchMultiplier(match.id);
  let pointsEarned = null;
  if (isFinished && result && prediction) {
    pointsEarned = calculateMatchPoints(
      match.id,
      prediction.home_score,
      prediction.away_score,
      result.home_score,
      result.away_score
    );
  }

  const getPointsLabel = () => {
    if (pointsEarned === 5 * multiplier) return `¡Exacto! +${5 * multiplier} pts`;
    if (pointsEarned === 3 * multiplier) return `Diferencia +${3 * multiplier} pts`;
    if (pointsEarned === 1 * multiplier) return `Ganador +${1 * multiplier} pt${multiplier > 1 ? 's' : ''}`;
    return '0 pts';
  };

  return (
    <div className={`match-card glass-panel ${isFinished ? 'finished' : ''} ${isLive ? 'live' : ''}`}>
      {/* Header */}
      <div className="match-card-header">
        <span className="match-group badge badge-group">{match.group}</span>
        <div className="match-meta">
          {isLive && <span className="badge badge-live">EN VIVO</span>}
          {isFinished && <span className="badge badge-finished">Finalizado</span>}
          {!isLive && !isFinished && (
            <span className="match-datetime">
              <Clock size={12} />
              {formatDate(matchDate)} · {formatTime(matchDate)}
            </span>
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="match-card-teams">
        <div className="team-side home">
          <span className="team-flag">{match.homeFlag}</span>
          <span className="team-name">{match.homeTeam}</span>
        </div>

        {isFinished && result ? (
          <div className="match-final-score">
            <span className="final-score">{result.home_score}</span>
            <span className="score-divider">-</span>
            <span className="final-score">{result.away_score}</span>
          </div>
        ) : (
          <div className="vs-badge">VS</div>
        )}

        <div className="team-side away">
          <span className="team-name">{match.awayTeam}</span>
          <span className="team-flag">{match.awayFlag}</span>
        </div>
      </div>

      {/* Prediction input */}
      <div className="match-card-prediction">
        {isFinished && pointsEarned !== null ? (
          <div className={`points-result ${pointsEarned === 5 * multiplier ? 'exact' : pointsEarned === 3 * multiplier ? 'difference' : pointsEarned === 1 * multiplier ? 'winner' : 'wrong'}`}>
            <Zap size={16} />
            <span>{getPointsLabel()}</span>
            {prediction && (
              <span className="your-prediction">
                Tu pronóstico: {prediction.home_score} - {prediction.away_score}
              </span>
            )}
          </div>
        ) : isFinished && !prediction ? (
          <div className="points-result wrong">
            <span>No apostaste</span>
          </div>
        ) : (disabled || isLocked) ? (
          <div className="points-result wrong" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
            <Lock size={14} style={{ marginRight: '4px' }} />
            <span>Pronóstico Cerrado</span>
            {prediction ? (
              <span className="your-prediction" style={{ opacity: 1, fontWeight: 700 }}>
                Tu marcador final: {prediction.home_score} - {prediction.away_score}
              </span>
            ) : (
              <span className="your-prediction">No ingresaste pronóstico</span>
            )}
          </div>
        ) : (
          <>
            <div className="prediction-inputs">
              <input
                type="number"
                className="score-input"
                min="0"
                max="20"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                disabled={disabled || isPast}
                placeholder="0"
              />
              <span className="prediction-separator">-</span>
              <input
                type="number"
                className="score-input"
                min="0"
                max="20"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                disabled={disabled || isPast}
                placeholder="0"
              />
            </div>
            <button
              className={`btn btn-sm ${saved ? 'btn-accent' : 'btn-primary'}`}
              onClick={handleSave}
              disabled={saving || disabled || isPast || homeScore === '' || awayScore === ''}
            >
              {saving && <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
              {saved && <Check size={14} />}
              {!saving && !saved && <Save size={14} />}
              {saved ? 'Guardado' : 'Guardar'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MatchCard;
