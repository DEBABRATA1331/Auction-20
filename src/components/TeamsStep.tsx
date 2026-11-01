import React, { useState, useEffect } from 'react';
import { Player } from '../types/game';
import { CHAR_BY_ID, money, MIN_TEAM_SIZE, purse } from '../game/rules';
import { CharacterImage } from './CharacterImage';
import { PlayerAvatar } from './ui';
import { Shield, ArrowRight, Sparkles, Check, AlertCircle, Star } from 'lucide-react';
import { sound } from '../utils/audio';

interface TeamsStepProps {
  players: Player[];
  onUpdatePlayers: (players: Player[]) => void;
  onNext: () => void;
}

export const TeamsStep: React.FC<TeamsStepProps> = ({
  players,
  onUpdatePlayers,
  onNext,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');

  // Ensure every player defaults to 5 selected if not yet initialized
  useEffect(() => {
    let changed = false;
    const updated = players.map(p => {
      if (p.roster.length >= MIN_TEAM_SIZE && (!p.active || p.active.length !== 5)) {
        changed = true;
        return {
          ...p,
          active: p.roster.slice(0, 5),
        };
      }
      return p;
    });
    if (changed) {
      onUpdatePlayers(updated);
    }
  }, [players, onUpdatePlayers]);

  const activePlayer = players.find(p => p.id === selectedPlayerId) || players[0];

  const handleToggleCharacter = (charId: string) => {
    if (!activePlayer) return;
    sound.click();

    const isCore = activePlayer.active.includes(charId);
    let newActive: string[];

    if (isCore) {
      // Remove from core
      newActive = activePlayer.active.filter(id => id !== charId);
    } else {
      // Add to core if under 5
      if (activePlayer.active.length < 5) {
        newActive = [...activePlayer.active, charId];
      } else {
        // If already 5, replace the last core member with this one
        newActive = [...activePlayer.active.slice(0, 4), charId];
      }
    }

    const updated = players.map(p =>
      p.id === activePlayer.id ? { ...p, active: newActive } : p
    );
    onUpdatePlayers(updated);
  };

  const handleSelectFirst5 = () => {
    if (!activePlayer) return;
    sound.bid();
    const newActive = activePlayer.roster.slice(0, 5);
    const updated = players.map(p =>
      p.id === activePlayer.id ? { ...p, active: newActive } : p
    );
    onUpdatePlayers(updated);
  };

  // Every player must have exactly 5 in active Best 5 Core
  const allComplete = players.every(p => p.roster.length >= 5 && p.active && p.active.length === 5);

  const bonusCount = activePlayer ? Math.max(0, activePlayer.roster.length - (activePlayer.active?.length || 0)) : 0;

  return (
    <div className="teams-page fade-in">
      <div className="section-head">
        <h1 className="section-title">CHOOSE YOUR BEST 5 HEROES</h1>
        <p className="section-subtitle">
          Select your 5 primary combatants. All remaining heroes serve as Bonus Players (+10%–25% extra points based on character value).
        </p>
      </div>

      {/* Player Selection Tabs */}
      <div className="player-tabs-bar">
        {players.map(p => {
          const isCurrent = p.id === activePlayer?.id;
          const isCoreReady = p.active && p.active.length === 5;
          const bCount = Math.max(0, p.roster.length - 5);
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
              <span className={`tab-count ${isCoreReady ? 'complete' : 'incomplete'}`}>
                {p.active?.length || 0}/5 Core {bCount > 0 ? `(+${bCount} Bonus)` : ''}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Player Roster Display */}
      {activePlayer && (
        <div className="roster-editor-card card mt-3">
          <div className="roster-editor-header">
            <div className="editor-title-group">
              <PlayerAvatar name={activePlayer.name} color={activePlayer.color} size={40} />
              <div>
                <h3 className="editor-player-name">{activePlayer.name}&apos;s Squad</h3>
                <span className="editor-meta">
                  {activePlayer.active?.length || 0} of 5 Core Chosen • {bonusCount} Bonus Heroes • {money(activePlayer.spent)} Spent ({money(purse(activePlayer))} Left)
                </span>
              </div>
            </div>

            <div className="bonus-summary-chip">
              <Sparkles size={16} className="text-yellow" />
              <span>
                {bonusCount} Bonus Heroes Active (+10%–25% value boost each)
              </span>
            </div>
          </div>

          <div className="squad-instruction-banner">
            <span>Tap any character to toggle between <strong>Best 5 Core</strong> and <strong>Bonus Bench</strong>.</span>
            {activePlayer.active?.length !== 5 && (
              <button
                type="button"
                className="btn btn-yellow btn-sm ml-2"
                onClick={handleSelectFirst5}
              >
                Reset to First 5
              </button>
            )}
          </div>

          {/* Character Cards Grid (Strictly no hidden individual points shown!) */}
          <div className="roster-cards-grid mt-3">
            {activePlayer.roster.map((charId, idx) => {
              const c = CHAR_BY_ID[charId];
              if (!c) return null;
              const isCore = activePlayer.active?.includes(charId);
              const price = activePlayer.prices[charId] || 0;

              return (
                <div
                  key={charId}
                  className={`roster-char-card ${isCore ? 'is-core-player' : 'is-extra-player'}`}
                  onClick={() => handleToggleCharacter(charId)}
                >
                  <div className="roster-char-thumb">
                    <CharacterImage character={c} size="md" />
                    <span className={`status-badge ${isCore ? 'core-badge-active' : 'extra-badge'}`}>
                      {isCore ? (
                        <>
                          <Check size={12} /> Best 5 Core
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} /> Bonus Hero
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
          disabled={!allComplete}
          onClick={() => {
            sound.sold();
            onNext();
          }}
        >
          <span>Calculate Championship Verdict</span>
          <ArrowRight size={20} />
        </button>
      </div>

      {!allComplete && (
        <div className="error-banner center mt-2">
          <AlertCircle size={16} />
          <span>Every player must have exactly 5 heroes selected in their Best 5 Core.</span>
        </div>
      )}
    </div>
  );
};
