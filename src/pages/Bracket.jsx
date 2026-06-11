import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateKnockoutMatches } from '../lib/worldcupData';
import { getUserPredictions, savePrediction, getAllMatchResults } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import MatchCard from '../components/match/MatchCard';
import { Printer } from 'lucide-react';
import CountdownBanner, { POLLA_CLOSE_DEADLINE } from '../components/ui/CountdownBanner';
import './Bracket.css';
import './Pages.css';

const Bracket = () => {
  const { user, profile } = useAuth();
  const { addToast } = useToast();
  const [predictions, setPredictions] = useState([]);
  const [results, setResults] = useState([]);

  const knockoutMatches = useMemo(() => generateKnockoutMatches(), []);

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
      console.error('Error loading bracket data:', err);
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

  const handleSavePrediction = async (matchId, homeScore, awayScore) => {
    if (new Date() > POLLA_CLOSE_DEADLINE) {
      addToast('La polla ya está cerrada.', 'error');
      return;
    }
    await savePrediction(user.id, matchId, homeScore, awayScore);
    addToast('Pronóstico guardado ✓', 'success');
    loadData();
  };

  // Organize matches by stage for the visual bracket
  const stages = {
    R32: knockoutMatches.filter(m => m.stage === 'R32'),
    R16: knockoutMatches.filter(m => m.stage === 'R16'),
    QF: knockoutMatches.filter(m => m.stage === 'QF'),
    SF: knockoutMatches.filter(m => m.stage === 'SF'),
    F: knockoutMatches.filter(m => m.stage === 'F'),
  };

  const scoringStats = useMemo(() => {
    let exact = 0;
    let winner = 0;
    let wrong = 0;
    let totalPoints = 0;
    knockoutMatches.forEach(m => {
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
  }, [knockoutMatches, predictionMap, resultMap]);

  const completionStats = useMemo(() => {
    const total = knockoutMatches.length;
    const predicted = knockoutMatches.filter((m) => predictionMap[m.id]).length;
    return { total, predicted, percentage: total > 0 ? Math.round((predicted / total) * 100) : 0 };
  }, [knockoutMatches, predictionMap]);

  const isClosed = new Date() > POLLA_CLOSE_DEADLINE;

  return (
    <div className="page-container bracket-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Cuadro del Mundial 🏆</h1>
          <p className="subtitle">Visualiza el camino a la gran final y registra tus pronósticos.</p>
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

      <div className="bracket-wrapper">
        <div className="bracket-container">
          {/* R16 onwards to match the user's image style */}
          {['R16', 'QF', 'SF', 'F'].map((stageId) => (
            <div key={stageId} className={`bracket-column stage-${stageId}`}>
              <h3 className="stage-title">{stages[stageId][0]?.group}</h3>
              <div className="bracket-matches">
                {stages[stageId].map((match) => (
                  <div key={match.id} className="bracket-match-item">
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
            </div>
          ))}
        </div>
      </div>

      {/* Sección invisible en pantalla, optimizada solo para la impresión PDF */}
      <div className="print-section">
        <div className="print-container">
          <div className="print-header">
            <h1 className="print-title">🏆 Polla Mundialista 2026 🏆</h1>
            <p className="print-subtitle">Reporte Completo de Pronósticos - Fase de Eliminación Directa</p>
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
                <th style={{ width: '20%', textAlign: 'left' }}>Fase</th>
                <th style={{ width: '45%', textAlign: 'left' }}>Partido</th>
                <th style={{ width: '15%', textAlign: 'center' }}>Tu Pronóstico</th>
                <th style={{ width: '12%', textAlign: 'center' }}>Resultado Real</th>
                <th style={{ width: '8%', textAlign: 'center' }}>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {knockoutMatches.map((match) => {
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

export default Bracket;
