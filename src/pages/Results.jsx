import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, RotateCw, CheckCircle, Clock, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateGroupMatches, generateKnockoutMatches, GROUPS } from '../lib/worldcupData';
import { getAllMatchResults, saveMatchResult, calculatePoints } from '../lib/supabase';
import { syncLiveResultsToSupabase, getLiveScoreboard } from '../lib/footballApi';
import { useToast } from '../components/ui/Toast';
import MatchResultCard from '../components/match/MatchResultCard';
import './Pages.css';

const AUTO_REFRESH_INTERVAL = 60000; // 60 seconds

const Results = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [results, setResults] = useState([]);
  const [activeStage, setActiveStage] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [secondsAgo, setSecondsAgo] = useState(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const intervalRef = useRef(null);
  const tickRef = useRef(null);

  const allMatches = useMemo(() => {
    return [
      ...generateGroupMatches(),
      ...generateKnockoutMatches(),
    ];
  }, []);

  const loadResults = useCallback(async () => {
    try {
      const res = await getAllMatchResults().catch(() => []);
      setResults(res || []);
    } catch (err) {
      console.error('Error loading real match results:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Auto-sync: silently sync with ESPN every 60s and reload results
  useEffect(() => {
    // Initial auto-sync on mount
    const initialSync = async () => {
      const res = await syncLiveResultsToSupabase(false).catch(() => ({ success: false }));
      if (res.success) {
        setLastSyncTime(Date.now());
        if (res.updatedCount > 0) {
          loadResults();
        }
      }
    };
    initialSync();

    if (autoSyncEnabled) {
      intervalRef.current = setInterval(async () => {
        console.log('🔄 Auto-sync en progreso...');
        const res = await syncLiveResultsToSupabase(true).catch(() => ({ success: false }));
        if (res.success) {
          setLastSyncTime(Date.now());
          if (res.updatedCount > 0) {
            loadResults();
          }
        }
      }, AUTO_REFRESH_INTERVAL);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoSyncEnabled, loadResults]);

  // Update "seconds ago" ticker
  useEffect(() => {
    tickRef.current = setInterval(() => {
      if (lastSyncTime) {
        setSecondsAgo(Math.floor((Date.now() - lastSyncTime) / 1000));
      }
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [lastSyncTime]);

  const resultMap = useMemo(() => {
    const map = {};
    results.forEach((r) => (map[r.match_id] = r));
    return map;
  }, [results]);

  const filteredMatches = useMemo(() => {
    let matches = allMatches;

    if (activeStage !== 'ALL') {
      if (activeStage === 'GROUP_STAGE') {
        matches = matches.filter((m) => m.stage === 'GROUP_STAGE');
      } else {
        matches = matches.filter((m) => m.stage === activeStage);
      }
    }

    if (statusFilter === 'WITH_RESULT') {
      matches = matches.filter((m) => resultMap[m.id]);
    } else if (statusFilter === 'NO_RESULT') {
      matches = matches.filter((m) => !resultMap[m.id]);
    }

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
      await saveMatchResult(matchId, homeScore, awayScore, 'FINISHED');
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
      const res = await syncLiveResultsToSupabase(true);
      if (res.success) {
        setLastSyncTime(Date.now());
        if (res.updatedCount > 0) {
          addToast(`Sincronización completa: ${res.updatedCount} partidos actualizados ✓`, 'success');
        } else {
          addToast('Sincronización completa: No hay nuevos cambios ✓', 'info');
        }
        loadResults();
      } else {
        if (res.reason === 'THROTTLED') {
          addToast('Por favor espera unos segundos entre sincronizaciones.', 'warning');
        } else {
          addToast('Error al conectar con la API de resultados.', 'error');
        }
      }
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

  const formatSecondsAgo = (s) => {
    if (s === null) return '';
    if (s < 5) return 'ahora mismo';
    if (s < 60) return `hace ${s}s`;
    const m = Math.floor(s / 60);
    return `hace ${m}min`;
  };

  return (
    <div className="page-container">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Resultados Reales 🏆</h1>
          <p className="subtitle">
            Marcadores oficiales de la Copa Mundial 2026 — actualizados en tiempo real.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Live sync indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            color: autoSyncEnabled ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px 10px',
            borderRadius: '20px',
            background: autoSyncEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${autoSyncEnabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'}`,
            transition: 'all 0.2s ease',
          }} onClick={() => setAutoSyncEnabled(!autoSyncEnabled)} title={autoSyncEnabled ? 'Auto-sync activo (click para desactivar)' : 'Auto-sync desactivado (click para activar)'}>
            {autoSyncEnabled ? (
              <>
                <Wifi size={12} />
                <span style={{ fontWeight: 600 }}>LIVE</span>
                {secondsAgo !== null && (
                  <span style={{ color: 'var(--text-muted)' }}>· {formatSecondsAgo(secondsAgo)}</span>
                )}
              </>
            ) : (
              <>
                <WifiOff size={12} />
                <span>Auto-sync OFF</span>
              </>
            )}
          </div>

          <button
            className="btn btn-secondary"
            onClick={handleApiSync}
            disabled={syncing}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RotateCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
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

      {/* Info Banner */}
      <div className="glass-panel animate-in stagger-2" style={{ padding: '1rem', display: 'flex', gap: '12px', alignItems: 'center', borderLeft: '4px solid var(--accent)' }}>
        <AlertTriangle size={24} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
          <strong>Sincronización automática activa:</strong> Los resultados se actualizan automáticamente 
          desde la ESPN cada 60 segundos. También puedes ingresar marcadores manualmente con 
          <strong> "Guardar Real"</strong> — el sistema recalculará los puntos de todos al instante.
        </p>
      </div>

      {/* Filters */}
      <div className="glass-panel animate-in stagger-3" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
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
