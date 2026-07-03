import React from 'react';

const CustomBall = ({ size = "1em", className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="-105 -105 210 210" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    style={{ verticalAlign: '-0.125em', display: 'inline-block' }}
  >
    <defs>
      <radialGradient id="ball-grad-b" cx="0.4" cy="0.3" r="0.8">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="40%" stopColor="#ffffff" />
        <stop offset="80%" stopColor="#eeeeee" />
      </radialGradient>
      
      <radialGradient id="ball-grad-d" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="80%" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="99%" stopColor="#000000" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#000000" stopOpacity="1" />
      </radialGradient>
      
      <clipPath id="ball-clip-a">
        <circle r="100" strokeWidth="0" />
      </clipPath>
      
      <g id="ball-pattern-c" strokeLinejoin="round" clipPath="url(#ball-clip-a)">
        {/* Black patches */}
        <path d="M6-32q20 4 40 13 11-16 18-28-14-21-27-29-20 1-36 8 3 17 5 36M-26-2q-19-6-36-9-12 16-14 33 7 18 26 32 18-7 33-15-6-24-9-41m-69 24q-7-10-7-30v88h17q-10-35-10-58m150 2Q41 41 24 52q4 13 7 27 24-1 37-12 10-17 12-32-15-7-25-11M0 120l-3-25q-22-2-39-13-8 2-18-1M-90-48q10-4 22-1 16-22 33-28 0-23-5-23h-60m200 45L87-37Q98-10 97 5l3 1" fill="#1e293b" />
        {/* Seam lines */}
        <path fill="none" d="M6-32Q-18-12-26-2m72-17q8 24 9 43m9-71q13 3 23 10M37-76q2-14-1-24M1-68q-14-9-36-9m-27 66q-5-14-6-38m-8 71q-9 2-19 0m45 32q1 16 8 28m25-43q17 9 41 13m7 27Q20 92-3 95m71-28 12 13m0-45Q90 25 97 5" />
      </g>
    </defs>
    <circle r="100" fill="#ffffff" />
    <circle r="100" fill="url(#ball-grad-b)" />
    
    <use href="#ball-pattern-c" stroke="#f1f5f9" strokeWidth="7" />
    <use href="#ball-pattern-c" stroke="#cbd5e1" strokeWidth="4" />
    <use href="#ball-pattern-c" stroke="#94a3b8" strokeWidth="2" />
    <use href="#ball-pattern-c" stroke="#0f172a" />
    
    <circle r="100" fill="url(#ball-grad-d)" />
  </svg>
);

export default CustomBall;
