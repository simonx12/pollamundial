import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateGroupMatches, GROUPS } from '../lib/worldcupData';
import { getUserPredictions, savePrediction, getAllMatchResults } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import MatchCard from '../components/match/MatchCard';
import './Pages.css';

const Predictions = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [predictions, setPredictions] = useState([]);
  const [results, setResults] = useState([]);
  const [activeGroup, setActiveGroup] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, FINISHED

  const allMatches = useMemo(() => generateGroupMatches(), []);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      const [preds, res] = await Promise.all([
        getUserPredictions(user.id).catch(() => []),
        getAllMatchResults().catch(() => []),
      ]);
      setPredictions(preds || []);
      setResults(res || []);
    } catch (err) {
      console.error('Error loading predictions:', err);
    }
  }

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

  const filteredMatches = useMemo(() => {
    let matches = allMatches;

    // Group filter
    if (activeGroup !== 'ALL') {
      matches = matches.filter((m) => m.group === `Grupo ${activeGroup}`);
    }

    // Status filter
    if (statusFilter === 'PENDING') {
      matches = matches.filter((m) => !resultMap[m.id]);
    } else if (statusFilter === 'FINISHED') {
      matches = matches.filter((m) => resultMap[m.id]);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      matches = matches.filter(
        (m) =>
          m.homeTeam.toLowerCase().includes(q) ||
          m.awayTeam.toLowerCase().includes(q) ||
          m.group.toLowerCase().includes(q)
      );
    }

    return matches;
  }, [allMatches, activeGroup, statusFilter, searchQuery, resultMap]);

  const handleSavePrediction = async (matchId, homeScore, awayScore) => {
    await savePrediction(user.id, matchId, homeScore, awayScore);
    addToast('Pronóstico guardado ✓', 'success');
    loadData();
  };

  const groups = ['ALL', ...Object.keys(GROUPS)];

  const completionStats = useMemo(() => {
    const total = allMatches.length;
    const predicted = allMatches.filter((m) => predictionMap[m.id]).length;
    return { total, predicted, percentage: total > 0 ? Math.round((predicted / total) * 100) : 0 };
  }, [allMatches, predictionMap]);

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Mis Pronósticos ⚽</h1>
          <p className="subtitle">
            Ingresa y modifica tus predicciones antes de que empiece cada partido.
          </p>
        </div>
      </header>

      {/* Progress bar */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
            Progreso: {completionStats.predicted} / {completionStats.total} partidos
          </span>
          <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
            {completionStats.percentage}%
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          borderRadius: '4px',
          background: 'var(--panel-hover)',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${completionStats.percentage}%`,
            height: '100%',
            borderRadius: '4px',
            background: 'linear-gradient(90deg, var(--primary), var(--accent))',
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }} />
          <input
            type="text"
            className="input-field"
            placeholder="Buscar equipo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>

        {/* Status filter */}
        <div className="filter-tabs">
          {[
            { key: 'ALL', label: 'Todos' },
            { key: 'PENDING', label: 'Pendientes' },
            { key: 'FINISHED', label: 'Finalizados' },
          ].map((f) => (
            <button
              key={f.key}
              className={`filter-tab ${statusFilter === f.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Group filter */}
        <div className="filter-tabs" style={{ overflowX: 'auto' }}>
          {groups.map((g) => (
            <button
              key={g}
              className={`filter-tab ${activeGroup === g ? 'active' : ''}`}
              onClick={() => setActiveGroup(g)}
            >
              {g === 'ALL' ? 'Todos' : `Grupo ${g}`}
            </button>
          ))}
        </div>
      </div>

      {/* Match list */}
      {filteredMatches.length > 0 ? (
        <div className="matches-grid">
          {filteredMatches.map((match, index) => (
            <div key={match.id} className="animate-in" style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}>
              <MatchCard
                match={match}
                prediction={predictionMap[match.id]}
                result={resultMap[match.id]}
                onSavePrediction={handleSavePrediction}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel">
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <p>No se encontraron partidos con estos filtros.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Predictions;
