import React from 'react';
import { initials } from '../game/rules';

interface PlayerAvatarProps {
  name: string;
  color: string;
  size?: number;
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ name, color, size = 36, className = '' }) => {
  return (
    <div
      className={`player-avatar ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: `${color}25`,
        border: `2px solid ${color}`,
        color: '#ffffff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: `${Math.round(size * 0.38)}px`,
        flexShrink: 0,
        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
      }}
    >
      {initials(name)}
    </div>
  );
};

interface StatBarProps {
  label: string;
  value: number; // 1 to 5 or higher
  max?: number;
  color?: string;
}

export const StatBar: React.FC<StatBarProps> = ({ label, value, max = 5, color = '#ffc21a' }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="stat-bar-item">
      <div className="stat-bar-header">
        <span className="stat-bar-label">{label}</span>
        <span className="stat-bar-value">{value}</span>
      </div>
      <div className="stat-bar-track">
        <div
          className="stat-bar-fill"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};
