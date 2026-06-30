import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Users, TrendingUp, HelpCircle, Shield, Award, AlertCircle, RefreshCw, BarChart2 } from 'lucide-react';
import { getLeaderboard, getAllMatchResults, getUserPredictions } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { generateGroupMatches, generateKnockoutMatches, TEAMS, GROUPS, getMatchMultiplier } from '../lib/worldcupData';
import './Pages.css';

const StandingsAnalysis = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('players'); // 'players' or 'teams'
  const [players, setPlayers] = useState([]);
  const [results, setResults] = useState([]);
  const [userPredictions, setUserPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  async function loadData() {
    setLoading(true);
    try {
      const [leaderboardData, matchResults, preds] = await Promise.all([
        getLeaderboard().catch(() => []),
        getAllMatchResults().catch(() => []),
        user ? getUserPredictions(user.id).catch(() => []) : Promise.resolve([]),
      ]);

      setPlayers(leaderboardData || []);
      setResults(matchResults || []);
      setUserPredictions(preds || []);
    } catch (err) {
      console.error('Error loading analytics data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Partidos estáticos de referencia (Grupos + Eliminatorias)
  const allMatches = useMemo(() => {
    return [
      ...generateGroupMatches(),
      ...generateKnockoutMatches(),
    ];
  }, []);

  // Fallback demo data if no players exist or loading failed
  const displayPlayers = useMemo(() => {
    if (players.length > 0) return players;
    
    // High-quality mock data representing a realistic pool
    return [
      { id: '1', username: 'Simón', total_points: 45, exact_hits: 8, winner_hits: 21, bet_amount: 20000 },
      { id: '2', username: 'Carlos', total_points: 42, exact_hits: 7, winner_hits: 21, bet_amount: 20000 },
      { id: '3', username: 'María', total_points: 38, exact_hits: 6, winner_hits: 20, bet_amount: 20000 },
      { id: '4', username: 'Andrés', total_points: 31, exact_hits: 4, winner_hits: 19, bet_amount: 20000 },
      { id: '5', username: 'Laura', total_points: 25, exact_hits: 3, winner_hits: 16, bet_amount: 20000 },
      { id: '6', username: 'Diego', total_points: 18, exact_hits: 2, winner_hits: 12, bet_amount: 20000 },
      { id: '7', username: 'Valentina', total_points: 12, exact_hits: 1, winner_hits: 9, bet_amount: 20000 },
      { id: '8', username: 'Juan', total_points: 8, exact_hits: 0, winner_hits: 8, bet_amount: 20000 },
    ];
  }, [players]);

  const matchStats = useMemo(() => {
    const total = allMatches.length;
    const finished = results.length;
    const remaining = total - finished;
    
    const resultMap = {};
    results.forEach(r => {
      resultMap[r.match_id] = r;
    });

    const remainingMatchesList = allMatches.filter(m => !resultMap[m.id]);
    const maxPointsRemaining = remainingMatchesList.reduce((sum, m) => sum + (5 * getMatchMultiplier(m.id)), 0);

    return {
      total,
      finished,
      remaining,
      maxPointsRemaining
    };
  }, [allMatches, results]);

  // Calculate player chances
  const playerChances = useMemo(() => {
    if (displayPlayers.length === 0) return [];

    const leaderPoints = displayPlayers[0].total_points;

    return displayPlayers.map((player, index) => {
      const maxPossiblePoints = player.total_points + matchStats.maxPointsRemaining;
      
      let status = 'IN_THE_FIGHT'; // 'LEADER', 'IN_THE_FIGHT', 'ELIMINATED'
      if (index === 0) {
        status = 'LEADER';
      } else if (maxPossiblePoints < leaderPoints) {
        status = 'ELIMINATED';
      }

      return {
        ...player,
        maxPossiblePoints,
        status,
      };
    });
  }, [displayPlayers, matchStats.maxPointsRemaining]);

  // Group Stage analysis (based on current user predictions)
  const groupStandings = useMemo(() => {
    // Generate all group matches
    const allGroupMatches = generateGroupMatches();
    const predictionMap = {};
    userPredictions.forEach(p => {
      predictionMap[p.match_id] = p;
    });

    // Initialize team stats
    const stats = {};
    Object.keys(TEAMS).forEach(code => {
      stats[code] = {
        code,
        name: TEAMS[code].name,
        flag: TEAMS[code].flag,
        points: 0,
        gd: 0,
        goals: 0,
        wins: 0,
      };
    });

    // Process group matches with predictions
    allGroupMatches.forEach(match => {
      const pred = predictionMap[match.id];
      let homeS = 0;
      let awayS = 0;
      let played = false;

      if (pred) {
        homeS = pred.home_score;
        awayS = pred.away_score;
        played = true;
      } else if (results.find(r => r.match_id === match.id)) {
        // Fallback to real result if no prediction but finished
        const res = results.find(r => r.match_id === match.id);
        homeS = res.home_score;
        awayS = res.away_score;
        played = true;
      }

      if (played && stats[match.homeCode] && stats[match.awayCode]) {
        stats[match.homeCode].goals += homeS;
        stats[match.awayCode].goals += awayS;
        stats[match.homeCode].gd += (homeS - awayS);
        stats[match.awayCode].gd += (awayS - homeS);

        if (homeS > awayS) {
          stats[match.homeCode].points += 3;
          stats[match.homeCode].wins += 1;
        } else if (awayS > homeS) {
          stats[match.awayCode].points += 3;
          stats[match.awayCode].wins += 1;
        } else {
          stats[match.homeCode].points += 1;
          stats[match.awayCode].points += 1;
        }
      }
    });

    // Sort teams by group
    const standingsByGroup = {};
    Object.entries(GROUPS).forEach(([groupLetter, teamCodes]) => {
      const groupTeams = teamCodes.map(code => stats[code]);
      // Sort: Points -> GD -> Goals
      groupTeams.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.goals - a.goals;
      });
      standingsByGroup[groupLetter] = groupTeams;
    });

    return standingsByGroup;
  }, [userPredictions, results]);

  // Knockout prediction analyzer
  const teamKnockoutStatuses = useMemo(() => {
    const predictionMap = {};
    userPredictions.forEach(p => {
      predictionMap[p.match_id] = p;
    });

    const statusMap = {};
    
    // Seed default status (eliminated in groups)
    Object.keys(TEAMS).forEach(code => {
      statusMap[code] = {
        code,
        name: TEAMS[code].name,
        flag: TEAMS[code].flag,
        stageReached: 'Fase de Grupos ❌',
        colorClass: 'text-danger',
        rank: 0,
      };
    });

    // 1. Gather all 3rd place teams to find the top 8
    const thirdPlaceTeams = [];
    Object.entries(groupStandings).forEach(([groupLetter, teams]) => {
      if (teams[2]) {
        thirdPlaceTeams.push({
          ...teams[2],
          groupLetter,
        });
      }
    });

    // Sort 3rd place teams: Points -> GD -> Goals -> Wins
    thirdPlaceTeams.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.goals !== a.goals) return b.goals - a.goals;
      return b.wins - a.wins;
    });

    const top8ThirdPlaceCodes = thirdPlaceTeams.slice(0, 8).map(t => t.code);

    // Mark qualified teams from Group Stage to Round of 32
    Object.entries(groupStandings).forEach(([groupLetter, teams]) => {
      if (teams[0]) {
        statusMap[teams[0].code].stageReached = 'Dieciseisavos 🛡️';
        statusMap[teams[0].code].colorClass = 'text-primary';
        statusMap[teams[0].code].rank = 1;
      }
      if (teams[1]) {
        statusMap[teams[1].code].stageReached = 'Dieciseisavos 🛡️';
        statusMap[teams[1].code].colorClass = 'text-primary';
        statusMap[teams[1].code].rank = 1;
      }
      if (teams[2] && top8ThirdPlaceCodes.includes(teams[2].code)) {
        statusMap[teams[2].code].stageReached = 'Dieciseisavos 🛡️';
        statusMap[teams[2].code].colorClass = 'text-primary';
        statusMap[teams[2].code].rank = 1;
      }
    });

    // Helper to resolve the best third place team according to placeholder rules
    const resolveThirdPlacePlaceholder = (placeholder, top3rdCodes) => {
      // e.g. "3A/B/C/D/F" -> ["A", "B", "C", "D", "F"]
      const groupsAllowed = placeholder.replace('3', '').split('/');
      for (const code of top3rdCodes) {
        const groupLetter = Object.keys(GROUPS).find(g => GROUPS[g].includes(code));
        if (groupsAllowed.includes(groupLetter)) {
          return code;
        }
      }
      return top3rdCodes[0] || null;
    };

    // Now look at knockout predictions to see who advances further
    const resolvedMatchWinner = {};
    const sortedKnockoutMatches = generateKnockoutMatches().sort((a, b) => a.num - b.num);
    
    sortedKnockoutMatches.forEach(match => {
      // Helper to resolve a team placeholder to a real team code
      const resolveTeamCode = (codeStr) => {
        if (!codeStr || codeStr === 'TBD') return null;

        // 1. Group ranks (e.g. "1A", "2B")
        const groupRankMatch = codeStr.match(/^([12])([A-L])$/);
        if (groupRankMatch) {
          const rank = parseInt(groupRankMatch[1], 10);
          const group = groupRankMatch[2];
          return groupStandings[group]?.[rank - 1]?.code || null;
        }

        // 2. Best third places (e.g. "3A/B/C/D/F")
        if (codeStr.startsWith('3')) {
          return resolveThirdPlacePlaceholder(codeStr, top8ThirdPlaceCodes);
        }

        // 3. Winners of previous matches (e.g. "W74")
        if (codeStr.startsWith('W')) {
          const prevMatchNum = parseInt(codeStr.substring(1), 10);
          return resolvedMatchWinner[prevMatchNum] || null;
        }

        // Default: if it's already a real code, return it
        return codeStr;
      };

      const homeRealCode = resolveTeamCode(match.homeCode);
      const awayRealCode = resolveTeamCode(match.awayCode);

      if (homeRealCode && awayRealCode) {
        const pred = predictionMap[match.id];
        
        if (pred && (pred.home_score !== null && pred.away_score !== null)) {
          const homeS = pred.home_score;
          const awayS = pred.away_score;
          const homeWins = homeS > awayS; // penalties are handled by score here
          
          const winnerCode = homeWins ? homeRealCode : awayRealCode;
          const loserCode = homeWins ? awayRealCode : homeRealCode;

          resolvedMatchWinner[match.num] = winnerCode;

          // Loser is eliminated in this stage
          const stageNames = {
            R32: { name: 'Dieciseisavos ❌', color: 'text-muted', rank: 1 },
            R16: { name: 'Octavos de Final ❌', color: 'text-muted', rank: 2 },
            QF: { name: 'Cuartos de Final ❌', color: 'text-muted', rank: 3 },
            SF: { name: 'Semifinales 🥉', color: 'bronze', rank: 4 },
            F: { name: 'Finalista 🥈', color: 'silver', rank: 5 },
          };

          const stageInfo = stageNames[match.stage];
          if (stageInfo && statusMap[loserCode]) {
            statusMap[loserCode].stageReached = stageInfo.name;
            statusMap[loserCode].colorClass = stageInfo.color;
            statusMap[loserCode].rank = stageInfo.rank;
          }

          // Winner advances
          const nextStages = {
            R32: { name: 'Octavos de Final 🔮', color: 'text-secondary', rank: 2 },
            R16: { name: 'Cuartos de Final 🔮', color: 'text-primary', rank: 3 },
            QF: { name: 'Semifinales 🥉', color: 'bronze', rank: 4 },
            SF: { name: 'Finalista 🥈', color: 'silver', rank: 5 },
            F: { name: 'Campeón Proyectado 🏆', color: 'gold', rank: 6 },
          };

          const nextInfo = nextStages[match.stage];
          if (nextInfo && statusMap[winnerCode]) {
            statusMap[winnerCode].stageReached = nextInfo.name;
            statusMap[winnerCode].colorClass = nextInfo.color;
            statusMap[winnerCode].rank = nextInfo.rank;
          }
        } else {
          // No prediction yet, but they are in this stage
          const entryStages = {
            R32: { name: 'Dieciseisavos 🛡️', color: 'text-primary', rank: 1 },
            R16: { name: 'Octavos de Final 🔮', color: 'text-secondary', rank: 2 },
            QF: { name: 'Cuartos de Final 🔮', color: 'text-primary', rank: 3 },
            SF: { name: 'Semifinales 🥉', color: 'bronze', rank: 4 },
            F: { name: 'Finalista 🥈', color: 'silver', rank: 5 },
          };
          const entryInfo = entryStages[match.stage];
          if (entryInfo) {
            if (statusMap[homeRealCode] && statusMap[homeRealCode].rank < entryInfo.rank) {
              statusMap[homeRealCode].stageReached = entryInfo.name;
              statusMap[homeRealCode].colorClass = entryInfo.color;
              statusMap[homeRealCode].rank = entryInfo.rank;
            }
            if (statusMap[awayRealCode] && statusMap[awayRealCode].rank < entryInfo.rank) {
              statusMap[awayRealCode].stageReached = entryInfo.name;
              statusMap[awayRealCode].colorClass = entryInfo.color;
              statusMap[awayRealCode].rank = entryInfo.rank;
            }
          }
        }
      }
    });

    return Object.values(statusMap).sort((a, b) => b.rank - a.rank || a.name.localeCompare(b.name));
  }, [groupStandings, userPredictions]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-screen" style={{ minHeight: '50vh' }}>
          <div className="spinner spinner-lg" />
          <h2>Cargando simulaciones...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1><span className="gradient-text">Simulador: Ganando y Eliminados</span> 📊</h1>
          <p className="subtitle">
            Análisis matemático en tiempo real de los participantes y el destino de los equipos del mundial.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="glass-panel" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'center' }}>
        <div className="filter-tabs" style={{ width: '100%', maxWidth: '500px', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <button 
            className={`filter-tab ${activeTab === 'players' ? 'active' : ''}`}
            onClick={() => setActiveTab('players')}
            style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Users size={16} />
            Participantes (Polla)
          </button>
          <button 
            className={`filter-tab ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
            style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Shield size={16} />
            Equipos (Mundial)
          </button>
        </div>
      </div>

      {activeTab === 'players' ? (
        <div className="animate-in">
          {/* Summary Box */}
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-card glass-panel" style={{ padding: '1.25rem' }}>
              <span className="stat-label">Partidos Jugados</span>
              <div className="stat-value blue" style={{ fontSize: '1.8rem' }}>{matchStats.finished} / {matchStats.total}</div>
              <p className="stat-desc">Fase de grupos + Eliminatorias</p>
            </div>
            <div className="stat-card glass-panel" style={{ padding: '1.25rem' }}>
              <span className="stat-label">Partidos por Jugar</span>
              <div className="stat-value green" style={{ fontSize: '1.8rem' }}>{matchStats.remaining}</div>
              <p className="stat-desc">Multiplicadores por fase activos</p>
            </div>
            <div className="stat-card glass-panel" style={{ padding: '1.25rem' }}>
              <span className="stat-label">Máximos Puntos en Juego</span>
              <div className="stat-value gold" style={{ fontSize: '1.8rem' }}>+{matchStats.maxPointsRemaining} pts</div>
              <p className="stat-desc">5 pts base × fase × partido</p>
            </div>
          </div>

          {/* Leaderboard Table with elimination calculation */}
          <div className="glass-panel section-panel">
            <div className="section-header">
              <h2>Standings Matemáticos de la Polla</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <AlertCircle size={14} />
                <span>Eliminado = Matemáticamente sin posibilidad de alcanzar al líder</span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Jugador</th>
                    <th style={{ textAlign: 'center' }}>Puntos Hoy</th>
                    <th style={{ textAlign: 'center' }}>Máx. Posible</th>
                    <th style={{ textAlign: 'center' }}>Probabilidad / Estado</th>
                    <th style={{ textAlign: 'right' }}>Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {playerChances.map((player, index) => (
                    <tr key={player.id} style={{ 
                      opacity: player.status === 'ELIMINATED' ? 0.6 : 1,
                      borderLeft: player.status === 'LEADER' ? '4px solid var(--gold)' : 'none'
                    }}>
                      <td>
                        <span className={`rank-cell ${index < 3 ? `rank-${index + 1}` : ''}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td>
                        <div className="player-cell">
                          <div className="player-avatar" style={{
                            background: player.status === 'LEADER' ? 'linear-gradient(135deg, var(--gold), #d97706)' : 
                                        player.status === 'ELIMINATED' ? '#475569' : 'linear-gradient(135deg, var(--primary), var(--accent))'
                          }}>
                            {player.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, display: 'block' }}>{player.username}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              🎯 Exactos: {player.exact_hits} · Ganador: {player.winner_hits}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="detail-cell" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {player.total_points}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="detail-cell" style={{ 
                          fontWeight: 700, 
                          color: player.status === 'ELIMINATED' ? 'var(--text-muted)' : 'var(--accent)'
                        }}>
                          {player.maxPossiblePoints} pts
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {player.status === 'LEADER' && (
                          <span className="badge" style={{ background: 'rgba(251, 191, 36, 0.15)', color: 'var(--gold)' }}>
                            👑 Líder Actual
                          </span>
                        )}
                        {player.status === 'IN_THE_FIGHT' && (
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent)' }}>
                            🔥 En la Pelea
                          </span>
                        )}
                        {player.status === 'ELIMINATED' && (
                          <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)' }}>
                            💀 Eliminado
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="points-cell" style={{ 
                          color: player.status === 'LEADER' ? 'var(--gold)' : 
                                 player.status === 'ELIMINATED' ? 'var(--text-muted)' : 'var(--primary)' 
                        }}>
                          {player.total_points}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in">
          {/* Tab: TEAMS */}
          <div className="glass-panel section-panel" style={{ marginBottom: '2rem' }}>
            <div className="section-header">
              <h2>Análisis del Mundial según tus Pronósticos 🔮</h2>
              <p className="subtitle" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', width: '100%' }}>
                Basado en los marcadores y clasificados que has guardado en la sección "Pronósticos" y "Cuadro".
              </p>
            </div>

            {/* Visual categories grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
              
              {/* Gold/Champion */}
              <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--gold)', background: 'rgba(251, 191, 36, 0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🏆</span>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold)' }}>Campeón Proyectado</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ganador de la Gran Final</span>
                  </div>
                </div>
                {teamKnockoutStatuses.filter(t => t.stageReached.includes('Campeón')).map(team => (
                  <div key={team.code} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.5rem', background: 'var(--panel-hover)', borderRadius: '10px' }}>
                    <span style={{ fontSize: '2rem' }}>{team.flag}</span>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{team.name}</span>
                  </div>
                ))}
              </div>

              {/* Subcampeon */}
              <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--silver)', background: 'rgba(209, 213, 219, 0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🥈</span>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--silver)' }}>Subcampeón</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Finalista derrotado</span>
                  </div>
                </div>
                {teamKnockoutStatuses.filter(t => t.stageReached.includes('Finalista')).map(team => (
                  <div key={team.code} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.5rem', background: 'var(--panel-hover)', borderRadius: '10px' }}>
                    <span style={{ fontSize: '1.8rem' }}>{team.flag}</span>
                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>{team.name}</span>
                  </div>
                ))}
              </div>

              {/* Semifinalists */}
              <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--bronze)', background: 'rgba(217, 119, 6, 0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🥉</span>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--bronze)' }}>Semifinalistas</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Eliminados en semifinales</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {teamKnockoutStatuses.filter(t => t.stageReached.includes('Semifinales')).map(team => (
                    <div key={team.code} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.4rem 0.8rem', background: 'var(--panel-hover)', borderRadius: '8px' }}>
                      <span>{team.flag}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{team.name}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* List breakdown of other teams */}
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={18} style={{ color: 'var(--primary)' }} />
                Destino Completo de las Selecciones Favoritas
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {teamKnockoutStatuses.slice(4, 16).map(team => (
                  <div key={team.code} className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{team.flag}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{team.name}</span>
                    </div>
                    <span className="badge" style={{ 
                      fontSize: '0.7rem',
                      background: team.stageReached.includes('Grupos') || team.stageReached.includes('Eliminado') ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                      color: team.stageReached.includes('Grupos') || team.stageReached.includes('Eliminado') ? 'var(--danger)' : 'var(--primary)'
                    }}>
                      {team.stageReached.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default StandingsAnalysis;
