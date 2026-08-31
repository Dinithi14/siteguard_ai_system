import React from 'react';

export const RiskGauge = ({ score = 0, level = 'LOW', size = 160 }) => {
  // Clamp score between 0 and 100
  const normalizedScore = Math.max(0, Math.min(100, score));
  
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use a 270 degree arc (3/4 circle)
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * normalizedScore) / 100;

  const getColor = () => {
    if (normalizedScore >= 65 || level.toUpperCase() === 'HIGH') return '#dc2626'; // Red
    if (normalizedScore >= 35 || level.toUpperCase() === 'MEDIUM') return '#d97706'; // Amber
    return '#16a34a'; // Green
  };

  const getBadgeClass = () => {
    if (normalizedScore >= 65 || level.toUpperCase() === 'HIGH') return 'badge-high';
    if (normalizedScore >= 35 || level.toUpperCase() === 'MEDIUM') return 'badge-medium';
    return 'badge-low';
  };

  const color = getColor();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(135deg)', overflow: 'visible' }}
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active Risk Stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.4s ease' }}
          />
        </svg>

        {/* Center Content */}
        <div style={{ position: 'absolute', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: `${size * 0.22}px`, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
            {normalizedScore}%
          </span>
          <span style={{ fontSize: `${size * 0.085}px`, fontWeight: 600, color: '#64748b', marginTop: '4px' }}>
            DELAY RISK
          </span>
        </div>
      </div>

      <div style={{ marginTop: '8px' }}>
        <span className={`badge ${getBadgeClass()}`}>
          {level.toUpperCase()} RISK
        </span>
      </div>
    </div>
  );
};

export default RiskGauge;
