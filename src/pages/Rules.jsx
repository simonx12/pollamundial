import React from 'react';

const Rules = () => {
  return (
    <div className="page-container glass-panel fade-in">
      <div className="page-header">
        <h2 className="page-title">Reglas de Puntuación</h2>
      </div>
      <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
        <img 
          src="/puntuacion.png" 
          alt="Sistema de puntuación" 
          style={{ 
            maxWidth: '100%', 
            borderRadius: '12px', 
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' 
          }} 
        />
      </div>
    </div>
  );
};

export default Rules;
