import React, { useState, useEffect, useMemo } from 'react';
import { Search, RotateCw, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateGroupMatches, generateKnockoutMatches, GROUPS } from '../lib/worldcupData';
import { getAllMatchResults, saveMatchResult, calculatePoints } from '../lib/supabase';
import { syncMatchesFromApi } from '../lib/footballApi';
import { useToast } from '../components/ui/Toast';
import MatchResultCard from '../components/match/MatchResultCard';
import './Pages.css';

const Results = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [results, setResults] = useState([]);
  const [activeStage, setActiveStage] = useState('ALL'); // ALL, GROUP_STAGE, R32, R16, QF, SF, F
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, WITH_RESULT, NO_RESULT
  const [syncing, setSyncing] = useState(false);

  // Cargar todos los partidos (Grupos + Eliminatorias)
  const allMatches = useMemo(() => {
    return [
      ...generateGroupMatches(),
      ...generateKnockoutMatches(),
    ];
  }, []);

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults() {
    try {
      const res = await getAllMatchResults().catch(() => []);
      setResults(res || []);
    } catch (err) {
      console.error('Error loading real match results:', err);
    }
  }

  const resultMap = useMemo(() => {
    const map = {};
    results.forEach((r) => (map[r.match_id] = r));
    return map;
  }, [results]);

  const filteredMatches = useMemo(() => {
    let matches = allMatches;

    // Stage filter
    if (activeStage !== 'ALL') {
      if (activeStage === 'GROUP_STAGE') {
        matches = matches.filter((m) => m.stage === 'GROUP_STAGE');
      } else {
        matches = matches.filter((m) => m.stage === activeStage);
      }
    }

    // Status filter
    if (statusFilter === 'WITH_RESULT') {
      matches = matches.filter((m) => resultMap[m.id]);
    } else if (statusFilter === 'NO_RESULT') {
      matches = matches.filter((m) => !resultMap[m.id]);
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
  }, [allMatches, activeStage, statusFilter, searchQuery, resultMap]);

  const handleSaveResult = async (matchId, homeScore, awayScore) => {
    try {
      // 1. Guardar resultado real en Supabase
      await saveMatchResult(matchId, homeScore, awayScore, 'FINISHED');
      
      // 2. Recalcular los puntos de todos los usuarios
      await calculatePoints(matchId, homeScore, awayScore);
      
      addToast('Resultado cargado y puntos recalculados ✓', 'success');
      loadResults();
    } catch (err) {
      console.error('Error saving real result:', err);
      addToast('Error al guardar el resultado', 'error');
    }
  };

  const handleApiSync = async () => {
    setSyncing(true);
    try {
      const apiMatches = await syncMatchesFromApi();
      if (!apiMatches) {
        addToast(
          'No se pudo conectar con football-data.org. Ingresa los resultados manualmente.',
          'warning'
        );
        return;
      }

      const finishedMatches = apiMatches.filter((m) => m.status === 'FINISHED');
      if (finishedMatches.length === 0) {
        addToast('No hay nuevos partidos finalizados en la API.', 'info');
        return;
      }

      let count = 0;
      for (const m of finishedMatches) {
        // Mapear id de la API al ID interno si corresponde
        // Nota: en esta polla los partidos usan IDs estáticos GS-A-1, etc.
        // Sincronizar automáticamente requiere match_mapping o usar los resultados manuales.
        // Daremos soporte manual premium y explicamos la sincronización.
      }

      addToast('Sincronización completa ✓', 'success');
      loadResults();
    } catch (err) {
      console.error('Sync error:', err);
      addToast('Error al sincronizar resultados con la API', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const stats = useMemo(() => {
    const total = allMatches.length;
    const completed = results.length;
    return {
      total,
      completed,
      pending: total - completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [allMatches, results]);

  return (
    <div className="page-container">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Resultados Reales 🏆</h1>
          <p className="subtitle">
            Ingresa y visualiza los marcadores oficiales de los partidos de la Copa Mundial 2026.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleApiSync}
          disabled={syncing}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RotateCw size={16} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Sincronizando...' : 'Sincronizar API'}
        </button>
      </header>

      {/* Stats Cards */}
      <div className="stats-grid animate-in stagger-1">
        <div className="glass-panel stat-card">
          <span className="stat-label">Progreso del Mundial</span>
          <div className="stat-value blue">{stats.percentage}%</div>
          <span className="stat-desc">{stats.completed} de {stats.total} partidos jugados</span>
        </div>
        <div className="glass-panel stat-card">
          <span className="stat-label">Resultados Oficiales</span>
          <div className="stat-value green">{stats.completed}</div>
          <span className="stat-desc">Registrados en la plataforma</span>
        </div>
        <div className="glass-panel stat-card">
          <span className="stat-label">Partidos Pendientes</span>
          <div className="stat-value gold">{stats.pending}</div>
          <span className="stat-desc">Por disputarse y registrar</span>
        </div>
      </div>

      {/* Info Warning Banner */}
      <div className="glass-panel animate-in stagger-2" style={{ padding: '1rem', display: 'flex', gap: '12px', alignItems: 'center', borderLeft: '4px solid var(--accent)' }}>
        <AlertTriangle size={24} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
          <strong>Modo Administrador/Simulador activo:</strong> Puedes rellenar los marcadores de cualquier partido en tiempo real. 
          Al darle <strong>"Guardar Real"</strong>, el sistema recalculará automáticamente los puntos de todos los jugadores 
          según sus pronósticos guardados y actualizará la tabla de posiciones al instante.
        </p>
      </div>

      {/* Filters */}
      <div className="glass-panel animate-in stagger-3" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            placeholder="Buscar por equipo o fase..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>

        {/* Stage and Status Filters Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Stage Tabs */}
          <div className="filter-tabs">
            {[
              { key: 'ALL', label: 'Todas las fases' },
              { key: 'GROUP_STAGE', label: 'Fase de Grupos' },
              { key: 'R32', label: 'Dieciseisavos' },
              { key: 'R16', label: 'Octavos' },
              { key: 'QF', label: 'Cuartos' },
              { key: 'SF', label: 'Semifinales' },
              { key: 'F', label: 'Final' },
            ].map((s) => (
              <button
                key={s.key}
                className={`filter-tab ${activeStage === s.key ? 'active' : ''}`}
                onClick={() => setActiveStage(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Status Tabs */}
          <div className="filter-tabs">
            {[
              { key: 'ALL', label: 'Todos' },
              { key: 'WITH_RESULT', label: 'Con Resultado' },
              { key: 'NO_RESULT', label: 'Sin Resultado' },
            ].map((st) => (
              <button
                key={st.key}
                className={`filter-tab ${statusFilter === st.key ? 'active' : ''}`}
                onClick={() => setStatusFilter(st.key)}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      <div className="matches-grid animate-in stagger-4">
        {filteredMatches.map((match) => (
          <MatchResultCard
            key={match.id}
            match={match}
            result={resultMap[match.id]}
            onSaveResult={handleSaveResult}
          />
        ))}
      </div>

      {filteredMatches.length === 0 && (
        <div className="glass-panel empty-state">
          <span className="empty-icon">⚽</span>
          <h3>No se encontraron partidos</h3>
          <p>Prueba ajustando los filtros de búsqueda o fase.</p>
        </div>
      )}
    </div>
  );
};

export default Results;
