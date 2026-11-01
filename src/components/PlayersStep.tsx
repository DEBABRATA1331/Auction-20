import React, { useState } from 'react';
import { Player } from '../types/game';
import { TOTAL_BUDGET, MIN_BID, BID_STEP, MIN_TEAM_SIZE, MAX_ROSTER_SIZE, PLAYER_COLORS } from '../game/rules';
import { PlayerAvatar } from './ui';
import { Plus, Trash2, ArrowRight, ShieldAlert, Sparkles, Coins, Users } from 'lucide-react';
import { sound } from '../utils/audio';

interface PlayersStepProps {
  players: Player[];
  onUpdatePlayers: (players: Player[]) => void;
  onNext: () => void;
}

export const PlayersStep: React.FC<PlayersStepProps> = ({
  players,
  onUpdatePlayers,
  onNext,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddPlayer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    if (players.length >= 6) {
      setErrorMsg('Maximum 6 players allowed');
      sound.skip();
      return;
    }

    if (players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('Player name already taken');
      sound.skip();
      return;
    }

    setErrorMsg('');
    const newColor = PLAYER_COLORS[players.length % PLAYER_COLORS.length];
    const newPlayer: Player = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      color: newColor,
      spent: 0,
      roster: [],
      prices: {},
      active: [],
    };

    onUpdatePlayers([...players, newPlayer]);
    setNameInput('');
    sound.bid();
  };

  const handleRemovePlayer = (id: string) => {
    onUpdatePlayers(players.filter(p => p.id !== id));
    sound.undo();
  };

  const canStart = players.length >= 2 && players.length <= 6;

  return (
    <div className="step-container fade-in">
      {/* Title block */}
      <div className="section-head">
        <h1 className="section-title">AUCTION LOBBY</h1>
        <p className="section-subtitle">
          Add 2 to 6 players to begin the live auction broadcast.
        </p>
      </div>

      {/* Rules summary tiles */}
      <div className="rules-grid">
        <div className="rule-chip">
          <Coins size={18} className="text-yellow" />
          <div className="rule-info">
            <span className="rule-val">₹{TOTAL_BUDGET.toFixed(0)}</span>
            <span className="rule-lbl">Starting Purse</span>
          </div>
        </div>
        <div className="rule-chip">
          <Sparkles size={18} className="text-yellow" />
          <div className="rule-info">
            <span className="rule-val">₹{MIN_BID.toFixed(0)}</span>
            <span className="rule-lbl">Opening Bid</span>
          </div>
        </div>
        <div className="rule-chip">
          <Plus size={18} className="text-red" />
          <div className="rule-info">
            <span className="rule-val">+₹{BID_STEP.toFixed(2)}</span>
            <span className="rule-lbl">Bid Increment</span>
          </div>
        </div>
        <div className="rule-chip">
          <Users size={18} className="text-red" />
          <div className="rule-info">
            <span className="rule-val">5 Heroes</span>
            <span className="rule-lbl">Extra = +3 Max Bonus</span>
          </div>
        </div>
      </div>

      {/* Input box */}
      <div className="card add-player-card">
        <form onSubmit={handleAddPlayer} className="add-player-form">
          <input
            type="text"
            className="input-field"
            placeholder="Type player name..."
            value={nameInput}
            onChange={e => {
              setNameInput(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            maxLength={20}
            autoFocus
          />
          <button
            type="submit"
            className="btn btn-yellow"
            disabled={!nameInput.trim() || players.length >= 6}
          >
            <Plus size={18} />
            <span>Add</span>
          </button>
        </form>

        {errorMsg && (
          <div className="error-banner">
            <ShieldAlert size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Slot counter */}
        <div className="slot-indicator">
          <span className="slot-text">
            {players.length} of 6 Player Slots Filled (Min 2 required)
          </span>
          <div className="slot-dots">
            {[0, 1, 2, 3, 4, 5].map(idx => (
              <div
                key={idx}
                className={`slot-dot ${idx < players.length ? 'filled' : ''}`}
                style={idx < players.length ? { backgroundColor: players[idx].color } : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Added players list */}
      {players.length > 0 && (
        <div className="players-list-grid">
          {players.map((p, index) => (
            <div key={p.id} className="player-row-card card">
              <div className="player-row-left">
                <span className="player-row-num">#{index + 1}</span>
                <PlayerAvatar name={p.name} color={p.color} size={36} />
                <span className="player-row-name">{p.name}</span>
              </div>
              <button
                type="button"
                className="icon-btn text-muted hover-danger"
                onClick={() => handleRemovePlayer(p.id)}
                title="Remove Player"
                aria-label={`Remove ${p.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Start Button */}
      <div className="action-bar-center">
        <button
          type="button"
          className="btn btn-red btn-lg btn-glow"
          disabled={!canStart}
          onClick={() => {
            sound.sold();
            onNext();
          }}
        >
          <span>Start Auction</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};
