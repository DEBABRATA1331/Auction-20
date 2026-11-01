import React, { useState } from 'react';
import { Player } from '../types/game';
import { CHAR_BY_ID, money, MIN_TEAM_SIZE, purse } from '../game/rules';
import { CharacterImage } from './CharacterImage';
import { PlayerAvatar } from './ui';
import { Shield, ArrowRight, Sparkles, Check, AlertCircle } from 'lucide-react';
import { sound } from '../utils/audio';

interface TeamsStepProps {
  players: Player[];
  onUpdatePlayers: (players: Player[]) => void;
  onNext: () => void;
}

export const TeamsStep: React.FC<TeamsStepProps> = ({
  players,
  onNext,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');

  const activePlayer = players.find(p => p.id === selectedPlayerId) || players[0];

  // All players must have at least 5 heroes
  const allReady = players.every(p => p.roster.length >= MIN_TEAM_SIZE);

  return (
    <div className="teams-page fade-in">
      <div className="section-head">
        <h1 className="section-title">SQUAD AUDIT</h1>
        <p className="section-subtitle">
          Review player squads. 5 characters are required; any extra characters provide up to +3 bonus points.
        </p>
      </div>

      {/* Player Selection Tabs */}
      <div className="player-tabs-bar">
        {players.map(p => {
          const isCurrent = p.id === activePlayer?.id;
          const isComplete = p.roster.length >= MIN_TEAM_SIZE;
          const extra = Math.max(0, p.roster.length - 5);
          return (
            <button
              key={p.id}
              type="button"
              className={`player-tab-btn ${isCurrent ? 'active' : ''}`}
              style={{ '--tab-color': p.color } as React.CSSProperties}
              onClick={() => {
                sound.click();
                setSelectedPlayerId(p.id);
              }}
            >
              <PlayerAvatar name={p.name} color={p.color} size={28} />
              <span className="tab-name">{p.name}</span>
              <span className={`tab-count ${isComplete ? 'complete' : 'incomplete'}`}>
                {p.roster.length} Heroes {extra > 0 ? `(+${extra})` : ''}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Player Roster Display (No individual scores revealed!) */}
      {activePlayer && (
        <div className="roster-editor-card card mt-3">
          <div className="roster-editor-header">
            <div className="editor-title-group">
              <PlayerAvatar name={activePlayer.name} color={activePlayer.color} size={40} />
              <div>
                <h3 className="editor-player-name">{activePlayer.name}&apos;s Squad</h3>
                <span className="editor-meta">
                  {activePlayer.roster.length} Characters Acquired • {money(activePlayer.spent)} Spent ({money(purse(activePlayer))} Left)
                </span>
              </div>
            </div>

            <div className="bonus-summary-chip">
              <Sparkles size={16} className="text-yellow" />
              <span>
                Extra Bonus:{' '}
                <strong>
                  +{Math.min(3.0, Math.max(0, activePlayer.roster.length - 5) * 1.0).toFixed(1)} Pts
                </strong>{' '}
                (Capped at 3.0)
              </span>
            </div>
          </div>

          {/* Cards Grid (No points, no subcategories - purely character photo, name, franchise, price) */}
          <div className="roster-cards-grid mt-3">
            {activePlayer.roster.map((charId, idx) => {
              const c = CHAR_BY_ID[charId];
              if (!c) return null;
              const isExtra = idx >= 5;
              const price = activePlayer.prices[charId] || 0;

              return (
                <div
                  key={charId}
                  className={`roster-char-card ${isExtra ? 'is-extra-player' : 'is-core-player'}`}
                >
                  <div className="roster-char-thumb">
                    <CharacterImage character={c} size="md" />
                    <span className={`status-badge ${isExtra ? 'extra-badge' : 'core-badge'}`}>
                      {isExtra ? (
                        <>
                          <Sparkles size={11} /> Bonus Player (+1)
                        </>
                      ) : (
                        <>
                          <Check size={11} /> Core Squad #{idx + 1}
                        </>
                      )}
                    </span>
                  </div>

                  <div className="roster-char-info">
                    <div className="roster-char-name-row">
                      <span className="roster-char-name">{c.name}</span>
                    </div>
                    <div className="roster-char-meta-row">
                      <span className="roster-char-franchise">{c.franchise}</span>
                      <span className="roster-char-price">{money(price)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom confirmation action */}
      <div className="action-bar-center mt-4">
        <button
          type="button"
          className="btn btn-red btn-lg btn-glow"
          disabled={!allReady}
          onClick={() => {
            sound.sold();
            onNext();
          }}
        >
          <span>Calculate Championship Verdict</span>
          <ArrowRight size={20} />
        </button>
      </div>

      {!allReady && (
        <div className="error-banner center mt-2">
          <AlertCircle size={16} />
          <span>Every player must have at least 5 heroes to calculate the verdict.</span>
        </div>
      )}
    </div>
  );
};
