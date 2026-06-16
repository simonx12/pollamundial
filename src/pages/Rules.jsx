import React from 'react';
import { Zap } from 'lucide-react';
import './Rules.css';

const Rules = () => {
  return (
    <div className="page-container glass-panel fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 className="page-title" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Sistema de puntuación</h2>
      </div>
      
      <div className="rules-grid">
        <div className="rule-card exact-score">
          <h3>+5</h3>
          <h4>Marcador exacto</h4>
          <p>Acertaste los dos números</p>
        </div>
        
        <div className="rule-card goal-diff">
          <h3>+3</h3>
          <h4>Diferencia de goles</h4>
          <p>Quién gana y por cuántos, o empate</p>
        </div>
        
        <div className="rule-card winner">
          <h3>+1</h3>
          <h4>Solo ganador</h4>
          <p>Aciertas quién gana, no la diferencia</p>
        </div>
        
        <div className="rule-card bonus">
          <h3>+15</h3>
          <h4>Bonus campeón</h4>
          <p>Solo en pollas completas</p>
        </div>
      </div>

      <div className="multiplier-card">
        <div className="multiplier-header">
          <div className="multiplier-icon">
            <Zap size={24} />
          </div>
          <div className="multiplier-text">
            <h4>Multiplicador por fase</h4>
            <p>A medida que avanzan las fases del torneo, los puntos otorgados aumentan.</p>
          </div>
        </div>
        <div className="multiplier-pills">
          <span className="pill">Grupos <span className="pill-x">×1</span></span>
          <span className="pill">Eliminatorias <span className="pill-x">×2</span></span>
          <span className="pill">Semis <span className="pill-x">×3</span></span>
          <span className="pill">Final <span className="pill-x">×4</span></span>
        </div>
      </div>
    </div>
  );
};

export default Rules;
