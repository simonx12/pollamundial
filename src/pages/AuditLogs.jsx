import React, { useState, useEffect, useMemo } from 'react';
import { History, Search, ArrowRight, ShieldAlert, Database, Info, RefreshCw } from 'lucide-react';
import { getAuditLogs } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './Pages.css';

const AuditLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState('ALL'); // ALL, predictions, match_results
  const [actionFilter, setActionFilter] = useState('ALL'); // ALL, INSERT, UPDATE, DELETE

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAuditLogs();
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  // Traducir el nombre de la tabla
  const formatTableName = (name) => {
    if (name === 'predictions') return 'Pronósticos';
    if (name === 'match_results') return 'Resultados Reales';
    return name;
  };

  // Convertir registros crudos de cambios en textos legibles
  const renderLogDetails = (log) => {
    const isPrediction = log.table_name === 'predictions';
    const isResult = log.table_name === 'match_results';

    const oldD = log.old_data || {};
    const newD = log.new_data || {};

    const matchId = newD.match_id || oldD.match_id || log.record_id;

    if (log.action === 'INSERT') {
      if (isPrediction) {
        return (
          <span>
            Registró pronóstico inicial de{' '}
            <strong>
              {newD.home_score} - {newD.away_score}
            </strong>{' '}
            para el partido <code>{matchId}</code>
          </span>
        );
      }
      if (isResult) {
        return (
          <span>
            Registró marcador oficial de{' '}
            <strong>
              {newD.home_score} - {newD.away_score}
            </strong>{' '}
            para el partido <code>{matchId}</code>
          </span>
        );
      }
      return <span>Creó registro con ID {log.record_id}</span>;
    }

    if (log.action === 'UPDATE') {
      if (isPrediction) {
        const changesHome = oldD.home_score !== newD.home_score;
        const changesAway = oldD.away_score !== newD.away_score;
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            Modificó pronóstico del partido <code>{matchId}</code> de:
            <span className="print-badge print-badge-wrong" style={{ textDecoration: 'line-through' }}>
              {oldD.home_score} - {oldD.away_score}
            </span>
            <ArrowRight size={12} />
            <span className="print-badge print-badge-exact">
              {newD.home_score} - {newD.away_score}
            </span>
          </span>
        );
      }
      if (isResult) {
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            Corrigió marcador oficial del partido <code>{matchId}</code> de:
            <span className="print-badge print-badge-wrong" style={{ textDecoration: 'line-through' }}>
              {oldD.home_score} - {oldD.away_score}
            </span>
            <ArrowRight size={12} />
            <span className="print-badge print-badge-exact">
              {newD.home_score} - {newD.away_score}
            </span>
          </span>
        );
      }
      return <span>Actualizó registro con ID {log.record_id}</span>;
    }

    if (log.action === 'DELETE') {
      if (isPrediction) {
        return (
          <span>
            Eliminó el pronóstico para el partido <code>{matchId}</code>
          </span>
        );
      }
      if (isResult) {
        return (
          <span>
            Eliminó el marcador oficial para el partido <code>{matchId}</code>
          </span>
        );
      }
      return <span>Eliminó registro con ID {log.record_id}</span>;
    }

    return <span>Acción {log.action} realizada</span>;
  };

  const filteredLogs = useMemo(() => {
    let result = logs;

    // Filter table
    if (tableFilter !== 'ALL') {
      result = result.filter((l) => l.table_name === tableFilter);
    }

    // Filter action
    if (actionFilter !== 'ALL') {
      result = result.filter((l) => l.action === actionFilter);
    }

    // Search query (username or match id)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((l) => {
        const username = l.profiles?.username?.toLowerCase() || 'jugador';
        const matchId = (l.new_data?.match_id || l.old_data?.match_id || l.record_id || '').toLowerCase();
        return username.includes(q) || matchId.includes(q);
      });
    }

    return result;
  }, [logs, tableFilter, actionFilter, searchQuery]);

  return (
    <div className="page-container">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1><span className="gradient-text">Auditoría de Actividad</span> 📜</h1>
          <p className="subtitle">
            Historial detallado de inserciones, actualizaciones y cambios en los marcadores de la polla.
          </p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={loadLogs}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refrescar</span>
        </button>
      </header>

      {error ? (
        <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid var(--primary-glow)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <ShieldAlert size={40} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                La tabla de auditoría no existe en la base de datos
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                Para habilitar el registro automático de auditoría, debes crear la tabla <code>audit_logs</code> y sus triggers
                en el panel de control de Supabase. Ya hemos guardado el script de configuración en tu proyecto.
              </p>

              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--panel-border)',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                marginBottom: '1.5rem',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  📍 Ubicación del Script SQL:
                </div>
                <code>scratch/audit_table_setup.sql</code>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn btn-primary"
                  onClick={loadLogs}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <RefreshCw size={16} />
                  Probar Conexión de nuevo
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Info Banner */}
          <div className="glass-panel animate-in stagger-1" style={{ padding: '1rem', display: 'flex', gap: '12px', alignItems: 'center', borderLeft: '4px solid var(--primary)' }}>
            <Info size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Cualquier cambio de pronóstico por parte de los usuarios, o de marcadores oficiales por los administradores, 
              es capturado automáticamente a nivel de base de datos y registrado de forma inmutable aquí.
            </p>
          </div>

          {/* Filters Panel */}
          <div className="glass-panel animate-in stagger-2" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                placeholder="Buscar por usuario o ID de partido (ej. GS-A-1)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="filter-tabs">
                {[
                  { key: 'ALL', label: 'Todas las tablas' },
                  { key: 'predictions', label: 'Pronósticos' },
                  { key: 'match_results', label: 'Resultados Oficiales' },
                ].map((t) => (
                  <button
                    key={t.key}
                    className={`filter-tab ${tableFilter === t.key ? 'active' : ''}`}
                    onClick={() => setTableFilter(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="filter-tabs">
                {[
                  { key: 'ALL', label: 'Todas las acciones' },
                  { key: 'INSERT', label: 'Creaciones' },
                  { key: 'UPDATE', label: 'Modificaciones' },
                  { key: 'DELETE', label: 'Eliminaciones' },
                ].map((a) => (
                  <button
                    key={a.key}
                    className={`filter-tab ${actionFilter === a.key ? 'active' : ''}`}
                    onClick={() => setActionFilter(a.key)}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Logs Table */}
          {loading ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
              <p style={{ color: 'var(--text-muted)' }}>Cargando bitácora de auditoría...</p>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="glass-panel animate-in stagger-3" style={{ padding: '1.25rem', overflowX: 'auto' }}>
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Fecha / Hora</th>
                    <th>Usuario</th>
                    <th>Tabla</th>
                    <th>Acción</th>
                    <th>Detalle del Cambio</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const date = new Date(log.created_at);
                    const formattedDate = date.toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });
                    const formattedTime = date.toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    });

                    let actionBadgeClass = 'print-badge-pending';
                    if (log.action === 'INSERT') actionBadgeClass = 'print-badge-exact';
                    if (log.action === 'UPDATE') actionBadgeClass = 'print-badge-winner';
                    if (log.action === 'DELETE') actionBadgeClass = 'print-badge-wrong';

                    return (
                      <tr key={log.id} style={{ transition: 'background-color 0.2s' }}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600 }}>{formattedDate}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '6px' }}>{formattedTime}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {log.profiles?.username || 'Sistema/Anónimo'}
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          <span className="badge badge-group" style={{ background: 'var(--panel-hover)', color: 'var(--text-primary)' }}>
                            {formatTableName(log.table_name)}
                          </span>
                        </td>
                        <td>
                          <span className={`print-badge ${actionBadgeClass}`} style={{ textTransform: 'uppercase', minWidth: '70px', display: 'inline-block' }}>
                            {log.action === 'INSERT' ? 'Crear' : log.action === 'UPDATE' ? 'Editar' : 'Borrar'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          {renderLogDetails(log)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass-panel empty-state">
              <span className="empty-icon">🔍</span>
              <h3>No se encontraron registros de auditoría</h3>
              <p>Prueba ajustando los filtros o realiza algunos cambios en tus marcadores.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditLogs;
