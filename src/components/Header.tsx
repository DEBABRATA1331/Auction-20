import React from 'react';
import { Gavel, Volume2, VolumeX, RotateCcw, Users, Flame, Shield, Trophy } from 'lucide-react';
import { sound } from '../utils/audio';

interface HeaderProps {
  currentStep: number; // 0: Players, 1: Auction, 2: Teams, 3: Results
  onSelectStep?: (step: number) => void;
  canNavigateToStep?: (step: number) => boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetGame: () => void;
}

const STEPS = [
  { id: 0, label: 'Players', icon: Users },
  { id: 1, label: 'Auction', icon: Flame },
  { id: 2, label: 'Squads', icon: Shield },
  { id: 3, label: 'Verdict', icon: Trophy },
];

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onSelectStep,
  canNavigateToStep,
  soundEnabled,
  onToggleSound,
  onResetGame,
}) => {
  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Brand */}
        <div className="brand-lockup">
          <div className="brand-icon-box">
            <Gavel className="brand-gavel" size={20} />
          </div>
          <div className="brand-text">
            <span className="brand-title">AUCTION</span>
            <span className="brand-badge">20</span>
          </div>
        </div>

        {/* Stepper */}
        <nav className="stepper-nav" aria-label="Game progress steps">
          {STEPS.map(step => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const canClick = canNavigateToStep ? canNavigateToStep(step.id) : false;

            return (
              <button
                key={step.id}
                type="button"
                className={`step-btn ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => {
                  if (canClick && onSelectStep) {
                    sound.click();
                    onSelectStep(step.id);
                  }
                }}
                disabled={!canClick && !isActive}
              >
                <div className="step-circle">
                  <Icon size={14} />
                </div>
                <span className="step-label">{step.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right utility buttons */}
        <div className="header-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              onToggleSound();
              sound.click();
            }}
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            aria-label="Sound toggle"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {currentStep > 0 && (
            <button
              type="button"
              className="icon-btn text-danger"
              onClick={onResetGame}
              title="Reset Game"
              aria-label="Reset Game"
            >
              <RotateCcw size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
