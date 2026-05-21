import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateKnockoutMatches } from '../lib/worldcupData';
import { getUserPredictions, savePrediction, getAllMatchResults } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import MatchCard from '../components/match/MatchCard';
import './Bracket.css';

const Bracket = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [predictions, setPredictions] = useState([]);
  const [results, setResults] = useState([]);

  const knockoutMatches = useMemo(() => generateKnockoutMatches(), []);

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

  return (
    <div className="page-container bracket-page">
      <header className="page-header">
        <h1>Cuadro del Mundial 🏆</h1>
        <p className="subtitle">Visualiza el camino a la gran final y registra tus pronósticos.</p>
      </header>

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
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Bracket;
