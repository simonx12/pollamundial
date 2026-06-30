import React from 'react';

const CustomBall = ({ size = "1em", className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    style={{ verticalAlign: '-0.125em', display: 'inline-block' }}
  >
    <defs>
      <pattern id="checkerboard" viewBox="0,0,20,20" width="25%" height="25%">
        <rect x="0" y="0" width="10" height="10" fill="#070a12" />
        <rect x="10" y="0" width="10" height="10" fill="#ff4a5a" />
        <rect x="0" y="10" width="10" height="10" fill="#ff4a5a" />
        <rect x="10" y="10" width="10" height="10" fill="#070a12" />
      </pattern>
      
      <radialGradient id="ball-shadow" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
        <stop offset="50%" stopColor="#000000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.7" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#checkerboard)" />
    <circle cx="50" cy="50" r="48" fill="url(#ball-shadow)" />
    <circle cx="50" cy="50" r="48" fill="none" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="2" />
  </svg>
);

export default CustomBall;
