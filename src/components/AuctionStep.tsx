import React, { useState, useMemo } from 'react';
import { Player, Character, ActionLog } from '../types/game';
import { CHAR_BY_ID, purse, maxBid, money, BID_STEP, MIN_BID, MIN_TEAM_SIZE, MAX_ROSTER_SIZE } from '../game/rules';
import { CharacterImage } from './CharacterImage';
import { PlayerAvatar } from './ui';
import { Gavel, FastForward, Undo2, ArrowRight, Shield, Award, Sparkles, AlertCircle, Quote } from 'lucide-react';
import { sound } from '../utils/audio';

interface AuctionStepProps {
  players: Player[];
  deck: string[]; // Character IDs
  lotIndex: number;
  skipped: string[];
  history: ActionLog[];
  onUpdatePlayers: (players: Player[]) => void;
  onUpdateDeck: (deck: string[]) => void;
  onUpdateLotIndex: (idx: number) => void;
  onUpdateSkipped: (skipped: string[]) => void;
  onUpdateHistory: (history: ActionLog[]) => void;
  onNext: () => void;
}

export const AuctionStep: React.FC<AuctionStepProps> = ({
  players,
  deck,
  lotIndex,
  skipped,
  history,
  onUpdatePlayers,
  onUpdateDeck,
  onUpdateLotIndex,
  onUpdateSkipped,
  onUpdateHistory,
  onNext,
}) => {
  // Current lot bid state
  const [currentBid, setCurrentBid] = useState<number>(MIN_BID);
  const [highBidderId, setHighBidderId] = useState<string | null>(null);
  const [bidHistory, setBidHistory] = useState<{ playerId: string; amount: number }[]>([]);
  const [stampAnimation, setStampAnimation] = useState<'SOLD' | 'SKIPPED' | null>(null);

  const currentCharacter: Character | undefined = useMemo(() => {
    const id = deck[lotIndex];
    return id ? CHAR_BY_ID[id] : undefined;
  }, [deck, lotIndex]);

  // Check if all players have met base requirement (5 characters)
  const allEligible = players.every(p => p.roster.length >= MIN_TEAM_SIZE);
  const isDeckFinished = lotIndex >= deck.length || !currentCharacter;

  // Place a bid for a player
  const handlePlaceBid = (playerId: string, customAmount?: number) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const allowed = maxBid(player);
    const amount = customAmount !== undefined ? customAmount : (highBidderId ? Number((currentBid + BID_STEP).toFixed(2)) : MIN_BID);

    if (amount > allowed) {
      sound.skip();
      return;
    }

    sound.bid();
    setCurrentBid(amount);
    setHighBidderId(playerId);
    setBidHistory(prev => [...prev, { playerId, amount }]);
  };

  // Quick increment chips for current high bid
  const handleAddIncrement = (inc: number) => {
    if (!highBidderId) return;
    const player = players.find(p => p.id === highBidderId);
    if (!player) return;

    const nextAmount = Number((currentBid + inc).toFixed(2));
    const allowed = maxBid(player);
    if (nextAmount <= allowed) {
      sound.bid();
      setCurrentBid(nextAmount);
      setBidHistory(prev => [...prev, { playerId: highBidderId, amount: nextAmount }]);
    } else {
      sound.skip();
    }
  };

  // Hammer: Sell character to highest bidder
  const handleHammerSold = () => {
    if (!currentCharacter || !highBidderId) return;
    const winnerId = highBidderId;
    const finalPrice = currentBid;

    sound.sold();
    setStampAnimation('SOLD');

    setTimeout(() => {
      // Update winner player's roster and spending
      const updatedPlayers = players.map(p => {
        if (p.id === winnerId) {
          const newRoster = [...p.roster, currentCharacter.id];
          const newPrices = { ...p.prices, [currentCharacter.id]: finalPrice };
          const newActive = newRoster.slice(0, 5);
          return {
            ...p,
            spent: Number((p.spent + finalPrice).toFixed(2)),
            roster: newRoster,
            prices: newPrices,
            active: newActive,
          };
        }
        return p;
      });

      onUpdatePlayers(updatedPlayers);
      onUpdateHistory([...history, { type: 'sale', charId: currentCharacter.id, playerId: winnerId, amount: finalPrice }]);
      
      // Advance to next lot
      onUpdateLotIndex(lotIndex + 1);
      setCurrentBid(MIN_BID);
      setHighBidderId(null);
      setBidHistory([]);
      setStampAnimation(null);
    }, 700);
  };

  // Skip character
  const handleSkipLot = () => {
    if (!currentCharacter) return;

    sound.skip();
    setStampAnimation('SKIPPED');

    setTimeout(() => {
      onUpdateSkipped([...skipped, currentCharacter.id]);
      onUpdateHistory([...history, { type: 'skip', charId: currentCharacter.id }]);
      onUpdateLotIndex(lotIndex + 1);
      setCurrentBid(MIN_BID);
      setHighBidderId(null);
      setBidHistory([]);
      setStampAnimation(null);
    }, 600);
  };

  // Undo either current bids or previous lot
  const handleUndo = () => {
    sound.undo();
    if (bidHistory.length > 0) {
      const newHistory = bidHistory.slice(0, -1);
      setBidHistory(newHistory);
      if (newHistory.length > 0) {
        const last = newHistory[newHistory.length - 1];
        setCurrentBid(last.amount);
        setHighBidderId(last.playerId);
      } else {
        setCurrentBid(MIN_BID);
        setHighBidderId(null);
      }
      return;
    }

    if (history.length === 0 || lotIndex === 0) return;
    const lastAction = history[history.length - 1];
    const newLotIdx = lotIndex - 1;

    if (lastAction.type === 'sale') {
      const updatedPlayers = players.map(p => {
        if (p.id === lastAction.playerId) {
          const newPrices = { ...p.prices };
          delete newPrices[lastAction.charId];
          const newRoster = p.roster.filter(id => id !== lastAction.charId);
          return {
            ...p,
            spent: Math.max(0, Number((p.spent - lastAction.amount).toFixed(2))),
            roster: newRoster,
            prices: newPrices,
            active: newRoster.slice(0, 5),
          };
        }
        return p;
      });
      onUpdatePlayers(updatedPlayers);
    } else if (lastAction.type === 'skip') {
      onUpdateSkipped(skipped.filter(id => id !== lastAction.charId));
    }

    onUpdateHistory(history.slice(0, -1));
    onUpdateLotIndex(newLotIdx);
    setCurrentBid(MIN_BID);
    setHighBidderId(null);
    setBidHistory([]);
  };

  const handleReauctionSkipped = () => {
    if (skipped.length === 0) return;
    sound.click();
    const newDeck = [...deck, ...skipped];
    onUpdateDeck(newDeck);
    onUpdateSkipped([]);
  };

  const highBidder = players.find(p => p.id === highBidderId);

  return (
    <div className="auction-page fade-in">
      {/* Top status bar */}
      <div className="auction-status-bar">
        <div className="lot-badge">
          <span className="lot-num">LOT #{lotIndex + 1}</span>
          <span className="lot-total">OF {deck.length}</span>
        </div>

        {skipped.length > 0 && (
          <div className="skipped-tag">
            <span>{skipped.length} Skipped</span>
            {isDeckFinished && (
              <button
                type="button"
                className="btn-link text-yellow ml-2"
                onClick={handleReauctionSkipped}
              >
                Re-auction
              </button>
            )}
          </div>
        )}

        <div className="auction-ready-status">
          {allEligible ? (
            <span className="badge-ready">
              <Shield size={14} /> 5 Squad Requirement Met (Extra = Bonus)
            </span>
          ) : (
            <span className="badge-pending">
              Need 5 characters per player
            </span>
          )}
        </div>
      </div>

      {/* Main Auction Work Area */}
      {!isDeckFinished && currentCharacter ? (
        <div className="auction-arena-grid">
          {/* Left Column: Character Card (HIDDEN STATS & RARITY - GUESS WORK) */}
          <div className="char-hero-card card">
            {stampAnimation && (
              <div className={`stamp-overlay ${stampAnimation.toLowerCase()}`}>
                {stampAnimation}
              </div>
            )}

            <div className="char-hero-media">
              <CharacterImage
                key={currentCharacter.id}
                character={currentCharacter}
                size="hero"
              />
              <div className="char-hero-badges">
                <span className="franchise-pill">{currentCharacter.franchise}</span>
                <span className="alignment-pill">{currentCharacter.alignment}</span>
              </div>
            </div>

            <div className="char-hero-body">
              <div className="char-title-row">
                <div>
                  <h2 className="char-name">{currentCharacter.name}</h2>
                  <span className="char-franchise-sub">{currentCharacter.franchise} Universe</span>
                </div>
              </div>

              {/* Special Ability & Cartoon Lore (No subcategories or ratings shown!) */}
              <div className="ability-box">
                <div className="ability-header">
                  <Sparkles size={16} className="text-yellow" />
                  <span className="ability-name">{currentCharacter.abilityName}</span>
                </div>
                <p className="ability-desc">{currentCharacter.abilityDescription}</p>
              </div>

              {currentCharacter.quote && (
                <div className="quote-box">
                  <Quote size={14} className="text-muted" />
                  <span className="quote-text">&ldquo;{currentCharacter.quote}&rdquo;</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Bidding Arena */}
          <div className="bidding-panel">
            {/* Bid Display Box */}
            <div className="bid-display-card card">
              <span className="bid-label">CURRENT BID</span>
              <div className="bid-amount-wrap">
                <span className="bid-currency">₹</span>
                <span className="bid-amount-number">{currentBid.toFixed(2)}</span>
              </div>

              {highBidder ? (
                <div className="high-bidder-pill" style={{ borderColor: highBidder.color }}>
                  <PlayerAvatar name={highBidder.name} color={highBidder.color} size={28} />
                  <span className="high-bidder-name">{highBidder.name} leads</span>
                </div>
              ) : (
                <span className="no-bidder-hint">Opening at minimum ₹{MIN_BID.toFixed(2)}</span>
              )}

              {/* Quick Increment Chips (if high bidder exists) */}
              {highBidderId && (
                <div className="quick-inc-row">
                  <span className="inc-lbl">Raise:</span>
                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => handleAddIncrement(0.25)}
                  >
                    +0.25
                  </button>
                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => handleAddIncrement(0.50)}
                  >
                    +0.50
                  </button>
                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => handleAddIncrement(1.00)}
                  >
                    +1.00
                  </button>
                </div>
              )}
            </div>

            {/* Bidders Grid */}
            <div className="bidders-section">
              <span className="bidders-title">TAP PLAYER TO BID</span>
              <div className="bidders-grid">
                {players.map(player => {
                  const allowed = maxBid(player);
                  const nextAmount = highBidderId ? Number((currentBid + BID_STEP).toFixed(2)) : MIN_BID;
                  const canBid = allowed >= nextAmount && player.roster.length < MAX_ROSTER_SIZE;
                  const isLeading = player.id === highBidderId;

                  const extraCount = Math.max(0, player.roster.length - 5);
                  const squadDisplay = player.roster.length <= 5
                    ? `${player.roster.length}/5 Squad`
                    : `5 (+${extraCount} Bonus)`;

                  return (
                    <button
                      key={player.id}
                      type="button"
                      className={`bidder-card ${isLeading ? 'leading' : ''}`}
                      style={{ '--p-color': player.color } as React.CSSProperties}
                      disabled={!canBid}
                      onClick={() => handlePlaceBid(player.id, nextAmount)}
                    >
                      <div className="bidder-header">
                        <PlayerAvatar name={player.name} color={player.color} size={32} />
                        <div className="bidder-meta">
                          <span className="bidder-name">{player.name}</span>
                          <span className="bidder-purse">{money(purse(player))} left</span>
                        </div>
                      </div>

                      <div className="bidder-footer">
                        <span className="bidder-roster">
                          {squadDisplay}
                        </span>
                        <span className="bid-tap-action">
                          {isLeading ? 'LEADING' : canBid ? `Bid ${money(nextAmount)}` : 'OUT'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sticky Auction Controls Bar */}
            <div className="auction-action-bar">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleUndo}
                title="Undo last bid or lot"
              >
                <Undo2 size={18} />
                <span>Undo</span>
              </button>

              <button
                type="button"
                className="btn btn-outline-yellow"
                onClick={handleSkipLot}
              >
                <FastForward size={18} />
                <span>Skip</span>
              </button>

              <button
                type="button"
                className="btn btn-red btn-sold"
                disabled={!highBidderId}
                onClick={handleHammerSold}
              >
                <Gavel size={20} />
                <span>SOLD {highBidderId ? money(currentBid) : ''}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Finished deck or complete */
        <div className="deck-finished-card card">
          <Award size={48} className="text-yellow mb-3" />
          <h2 className="finished-title">Auction Concluded</h2>
          <p className="finished-desc">
            All character lots processed. Every player must have at least 5 heroes. Extra heroes grant bonus points (up to +3).
          </p>
          <div className="finished-actions">
            {skipped.length > 0 && (
              <button
                type="button"
                className="btn btn-outline-yellow"
                onClick={handleReauctionSkipped}
              >
                Re-auction {skipped.length} Skipped Lots
              </button>
            )}
            <button
              type="button"
              className="btn btn-red btn-lg"
              disabled={!allEligible}
              onClick={() => {
                sound.step();
                onNext();
              }}
            >
              <span>Review Squads</span>
              <ArrowRight size={20} />
            </button>
          </div>
          {!allEligible && (
            <div className="error-banner mt-3">
              <AlertCircle size={16} />
              <span>Some players have less than {MIN_TEAM_SIZE} heroes. Continue bidding on skipped lots.</span>
            </div>
          )}
        </div>
      )}

      {/* Persistent Bottom Squads Inspector */}
      <div className="squads-summary-tray card mt-4">
        <div className="squads-tray-head">
          <span className="tray-title">PLAYER SQUADS (5 REQUIRED • EXTRA = BONUS)</span>
          {allEligible && (
            <button
              type="button"
              className="btn btn-yellow btn-sm"
              onClick={() => {
                sound.step();
                onNext();
              }}
            >
              <span>Review Squads & Proceed</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>

        <div className="squads-tray-grid">
          {players.map(p => {
            const extra = Math.max(0, p.roster.length - 5);
            return (
              <div key={p.id} className="squad-mini-card">
                <div className="squad-mini-header">
                  <PlayerAvatar name={p.name} color={p.color} size={24} />
                  <span className="squad-mini-name">{p.name}</span>
                  {extra > 0 && (
                    <span className="extra-bonus-tag">+{extra} Bonus Player</span>
                  )}
                  <span className="squad-mini-spent">{money(p.spent)} spent</span>
                </div>
                <div className="squad-mini-slots">
                  {Array.from({ length: MAX_ROSTER_SIZE }).map((_, slotIdx) => {
                    const charId = p.roster[slotIdx];
                    const c = charId ? CHAR_BY_ID[charId] : null;
                    const isExtraSlot = slotIdx >= 5;
                    return (
                      <div
                        key={slotIdx}
                        className={`squad-slot-tile ${c ? 'filled' : 'empty'} ${isExtraSlot ? 'bonus-slot' : ''}`}
                        title={c ? `${c.name} (${money(p.prices[c.id] || 0)})` : isExtraSlot ? `Bonus Slot #${slotIdx - 4}` : `Required #${slotIdx + 1}`}
                      >
                        {c ? (
                          <CharacterImage character={c} size="sm" />
                        ) : (
                          <span className="slot-empty-num">{isExtraSlot ? `+B` : slotIdx + 1}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
