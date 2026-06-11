import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Printer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateGroupMatches, GROUPS } from '../lib/worldcupData';
import { getUserPredictions, savePrediction, getAllMatchResults } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import MatchCard from '../components/match/MatchCard';
import CountdownBanner, { POLLA_CLOSE_DEADLINE } from '../components/ui/CountdownBanner';
import './Pages.css';

const Predictions = () => {
  const { user, profile } = useAuth();
  const { addToast } = useToast();

  const [predictions, setPredictions] = useState([]);
  const [results, setResults] = useState([]);
  const [activeGroup, setActiveGroup] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, FINISHED

  const allMatches = useMemo(() => generateGroupMatches(), []);

  useEffect(() => {
    if (user?.id) loadData();
  }, [user?.id]);

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
    if (new Date() > POLLA_CLOSE_DEADLINE) {
      addToast('La polla ya está cerrada.', 'error');
      return;
    }
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

  const scoringStats = useMemo(() => {
    let exact = 0;
    let winner = 0;
    let wrong = 0;
    let totalPoints = 0;
    allMatches.forEach(m => {
      const pred = predictionMap[m.id];
      const res = resultMap[m.id];
      if (res) {
        if (pred) {
          const predH = pred.home_score;
          const predA = pred.away_score;
          const realH = res.home_score;
          const realA = res.away_score;
          if (predH === realH && predA === realA) {
            exact++;
            totalPoints += 3;
          } else if (Math.sign(predH - predA) === Math.sign(realH - realA)) {
            winner++;
            totalPoints += 1;
          } else {
            wrong++;
          }
        } else {
          wrong++;
        }
      }
    });
    return { exact, winner, wrong, totalPoints };
  }, [allMatches, predictionMap, resultMap]);

  const isClosed = new Date() > POLLA_CLOSE_DEADLINE;

  return (
    <div className="page-container">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Mis Pronósticos ⚽</h1>
          <p className="subtitle">
            Ingresa y modifica tus predicciones antes de que empiece cada partido.
          </p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => window.print()}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Printer size={16} />
          <span>Exportar PDF</span>
        </button>
      </header>

      <CountdownBanner />

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
                disabled={isClosed}
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

      {/* Sección invisible en pantalla, optimizada solo para la impresión PDF */}
      <div className="print-section">
        <div className="print-container">
          <div className="print-header">
            <h1 className="print-title">🏆 Polla Mundialista 2026 🏆</h1>
            <p className="print-subtitle">Reporte Completo de Pronósticos - Fase de Grupos</p>
            <div className="print-meta">
              <span><strong>Usuario:</strong> {profile?.username || user?.email || 'Jugador'}</span>
              <span><strong>Fecha de Impresión:</strong> {new Date().toLocaleDateString('es-CO')}</span>
            </div>
          </div>

          <div className="print-stats-summary">
            <div className="print-stat-item">
              <span className="print-stat-label">Progreso</span>
              <span className="print-stat-value">{completionStats.predicted} / {completionStats.total} ({completionStats.percentage}%)</span>
            </div>
            <div className="print-stat-item">
              <span className="print-stat-label">Puntos Totales</span>
              <span className="print-stat-value">{scoringStats.totalPoints} pts</span>
            </div>
            <div className="print-stat-item">
              <span className="print-stat-label">Marcadores Exactos (+3)</span>
              <span className="print-stat-value">{scoringStats.exact}</span>
            </div>
            <div className="print-stat-item">
              <span className="print-stat-label">Acierto Ganador/Empate (+1)</span>
              <span className="print-stat-value">{scoringStats.winner}</span>
            </div>
          </div>

          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '15%', textAlign: 'left' }}>Grupo</th>
                <th style={{ width: '45%', textAlign: 'left' }}>Partido</th>
                <th style={{ width: '15%', textAlign: 'center' }}>Tu Pronóstico</th>
                <th style={{ width: '15%', textAlign: 'center' }}>Resultado Real</th>
                <th style={{ width: '10%', textAlign: 'center' }}>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {allMatches.map((match) => {
                const pred = predictionMap[match.id];
                const res = resultMap[match.id];
                let pointsText = '-';
                let pointsClass = 'print-badge-pending';
                
                if (res) {
                  if (pred) {
                    const predH = pred.home_score;
                    const predA = pred.away_score;
                    const realH = res.home_score;
                    const realA = res.away_score;
                    if (predH === realH && predA === realA) {
                      pointsText = '+3 pts';
                      pointsClass = 'print-badge-exact';
                    } else if (Math.sign(predH - predA) === Math.sign(realH - realA)) {
                      pointsText = '+1 pt';
                      pointsClass = 'print-badge-winner';
                    } else {
                      pointsText = '0 pts';
                      pointsClass = 'print-badge-wrong';
                    }
                  } else {
                    pointsText = '0 pts';
                    pointsClass = 'print-badge-wrong';
                  }
                }

                return (
                  <tr key={match.id}>
                    <td>{match.group}</td>
                    <td>
                      <span style={{ marginRight: '6px' }}>{match.homeFlag}</span>
                      <strong>{match.homeTeam}</strong>
                      <span style={{ margin: '0 8px', color: '#666' }}>vs</span>
                      <span style={{ marginRight: '6px' }}>{match.awayFlag}</span>
                      <strong>{match.awayTeam}</strong>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {pred ? (
                        <strong>{pred.home_score} - {pred.away_score}</strong>
                      ) : (
                        <span style={{ color: '#999' }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {res ? (
                        <strong>{res.home_score} - {res.away_score}</strong>
                      ) : (
                        <span style={{ color: '#999' }}>Por jugar</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`print-badge ${pointsClass}`}>
                        {pointsText}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Predictions;
