import React, { useState, useEffect } from 'react';
import { Save, Check, Clock, ShieldAlert } from 'lucide-react';
import './MatchCard.css'; // Reusamos el CSS del MatchCard para diseño consistente

const MatchResultCard = ({ match, result, onSaveResult, disabled }) => {
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (result) {
      setHomeScore(result.home_score?.toString() ?? '');
      setAwayScore(result.away_score?.toString() ?? '');
    } else {
      setHomeScore('');
      setAwayScore('');
    }
  }, [result]);

  const handleSave = async () => {
    if (homeScore === '' || awayScore === '') return;
    setSaving(true);
    try {
      await onSaveResult(match.id, parseInt(homeScore), parseInt(awayScore));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving match result:', err);
    } finally {
      setSaving(false);
    }
  };

  const matchDate = new Date(match.date);
  const hasResult = result !== undefined && result !== null;

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

  return (
    <div className={`match-card glass-panel ${hasResult ? 'finished' : ''}`}>
      {/* Header */}
      <div className="match-card-header">
        <span className="match-group badge badge-group">{match.group}</span>
        <div className="match-meta">
          {hasResult ? (
            <span className="badge badge-finished" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              ✓ Resultado Oficial
            </span>
          ) : (
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
          <span className="team-flag">{match.homeFlag || '🏳️'}</span>
          <span className="team-name">{match.homeTeam}</span>
        </div>

        <div className="vs-badge">VS</div>

        <div className="team-side away">
          <span className="team-name">{match.awayTeam}</span>
          <span className="team-flag">{match.awayFlag || '🏳️'}</span>
        </div>
      </div>

      {/* Real Result Input Panel */}
      <div className="match-card-prediction">
        <div className="prediction-inputs" style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="number"
              className="score-input"
              min="0"
              max="20"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              disabled={disabled}
              placeholder="Local"
              style={{ width: '60px', textAlign: 'center' }}
            />
            <span className="prediction-separator">-</span>
            <input
              type="number"
              className="score-input"
              min="0"
              max="20"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              disabled={disabled}
              placeholder="Visita"
              style={{ width: '60px', textAlign: 'center' }}
            />
          </div>

          <button
            className={`btn btn-sm ${saved ? 'btn-accent' : 'btn-primary'}`}
            onClick={handleSave}
            disabled={saving || disabled || homeScore === '' || awayScore === ''}
            style={{ minWidth: '110px' }}
          >
            {saving && <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
            {saved && <Check size={14} />}
            {!saving && !saved && <Save size={14} />}
            {saved ? 'Guardado ✓' : 'Guardar Real'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchResultCard;
