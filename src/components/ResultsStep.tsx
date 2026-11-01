import React, { useState, useEffect } from 'react';
import { Player, PlayerScore } from '../types/game';
import { evaluatePlayers } from '../game/scoring';
import { CHAR_BY_ID, money } from '../game/rules';
import { CharacterImage } from './CharacterImage';
import { PlayerAvatar } from './ui';
import { Trophy, Copy, Check, RotateCcw, Sparkles, TrendingUp, BarChart2, Share2, Image as ImageIcon } from 'lucide-react';
import { sound } from '../utils/audio';
import { StoryModal } from './StoryModal';
import confetti from 'canvas-confetti';

interface ResultsStepProps {
  players: Player[];
  onResetGame: () => void;
}

export const ResultsStep: React.FC<ResultsStepProps> = ({
  players,
  onResetGame,
}) => {
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDrumrolling, setIsDrumrolling] = useState(false);
  const [drumrollName, setDrumrollName] = useState('');
  const [copied, setCopied] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);

  useEffect(() => {
    const computed = evaluatePlayers(players);
    setScores(computed);
  }, [players]);

  const handleRevealWinner = () => {
    setIsDrumrolling(true);
    const cancelDrumroll = sound.drumroll(2300);

    const interval = setInterval(() => {
      const randomPlayer = players[Math.floor(Math.random() * players.length)];
      if (randomPlayer) setDrumrollName(randomPlayer.name);
    }, 90);

    setTimeout(() => {
      clearInterval(interval);
      cancelDrumroll();
      setIsDrumrolling(false);
      setIsRevealed(true);
      sound.fanfare();

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#e11d2e', '#ffc21a', '#ffffff', '#ffd700'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#e11d2e', '#ffc21a', '#ffffff'],
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#e11d2e', '#ffc21a', '#ffffff'],
        });
      }, 400);
    }, 2300);
  };

  const winner = scores[0];

  const handleCopyResults = () => {
    sound.click();
    let text = `🏆 AUCTION 20 CHAMPIONSHIP VERDICT 🏆\n\n`;
    scores.forEach(s => {
      const extraTag = s.benchDepth > 0 ? ` (+${s.benchDepth.toFixed(1)} Extra Bonus)` : '';
      text += `#${s.rank} ${s.player.name.toUpperCase()} — ${s.totalScore} PTS${extraTag}\n`;
      text += `• Archetype: ${s.archetype}\n`;
      text += `• Total Spent: ${money(s.player.spent)} | Roster: ${s.player.roster.length} Heroes\n`;
      text += `• Key Reason: ${s.reason}\n\n`;
    });
    text += `Broadcasted via AUCTION 20`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (!isRevealed) {
    return (
      <div className="reveal-curtain-card card fade-in text-center">
        <Trophy size={64} className="text-yellow mx-auto mb-3" />
        <h1 className="reveal-title">Mathematical Evaluation Complete</h1>
        <p className="reveal-sub">
          Squad combat effectiveness, extra player bonuses, and purse ROI have been cross-calculated.
        </p>

        {isDrumrolling ? (
          <div className="drumroll-box mt-4">
            <span className="drumroll-tag">AUDITING METRICS...</span>
            <div className="drumroll-cycler">{drumrollName}</div>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-red btn-lg btn-glow mt-4"
            onClick={handleRevealWinner}
          >
            <Sparkles size={20} />
            <span>Reveal Champion</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="results-page fade-in">
      {/* Champion Hero Card */}
      {winner && (
        <div className="winner-podium-card card">
          <div className="winner-podium-glow" />
          <div className="winner-badge-lockup">
            <Trophy size={28} className="text-yellow" />
            <span className="winner-crown-tag">AUCTION 20 CHAMPION</span>
          </div>

          <div className="winner-main-info">
            <PlayerAvatar name={winner.player.name} color={winner.player.color} size={64} />
            <div>
              <h2 className="winner-name">{winner.player.name}</h2>
              <span className="winner-archetype">{winner.archetype}</span>
            </div>
            <div className="winner-score-badge">
              <span className="winner-score-num">{winner.totalScore}</span>
              <span className="winner-score-max">/ 100 PTS</span>
            </div>
          </div>

          <p className="winner-verdict-text">{winner.reason}</p>

          {/* Winner's Roster (Character image and name only - NO individual scores!) */}
          <div className="winner-lineup">
            <span className="lineup-label">
              CHAMPIONSHIP SQUAD ({winner.player.active?.length || 5} CORE • {Math.max(0, winner.player.roster.length - 5)} BONUS HEROES)
            </span>
            <div className="winner-lineup-grid">
              {winner.player.roster.map(id => {
                const c = CHAR_BY_ID[id];
                if (!c) return null;
                const isCore = winner.player.active?.includes(id);
                return (
                  <div key={id} className={`winner-char-thumb ${isCore ? 'thumb-core' : 'thumb-bonus'}`} title={c.name}>
                    <CharacterImage character={c} size="md" />
                    <span className="winner-thumb-name">{c.name}</span>
                    <span className={`winner-thumb-role ${isCore ? 'role-core' : 'role-bonus'}`}>
                      {isCore ? 'Core' : 'Bonus'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Standings & Statistical Comparison */}
      <div className="standings-section mt-4">
        <div className="standings-header">
          <div className="standings-title-group">
            <BarChart2 size={20} className="text-yellow" />
            <h3 className="standings-title">Tournament Standings & Analysis</h3>
          </div>

          <div className="standings-actions">
            <button
              type="button"
              className="btn btn-yellow btn-sm"
              onClick={() => {
                sound.click();
                setShowStoryModal(true);
              }}
            >
              <Share2 size={16} />
              <span>Share Story / Status</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleCopyResults}
            >
              {copied ? <Check size={16} className="text-green" /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm text-danger"
              onClick={onResetGame}
            >
              <RotateCcw size={16} />
              <span>New Game</span>
            </button>
          </div>
        </div>

        <div className="standings-grid mt-3">
          {scores.map(s => {
            const isChamp = s.rank === 1;
            return (
              <div key={s.player.id} className={`standings-card card ${isChamp ? 'is-winner' : ''}`}>
                <div className="standings-card-top">
                  <div className="rank-player-lockup">
                    <span className={`rank-badge rank-${s.rank}`}>#{s.rank}</span>
                    <PlayerAvatar name={s.player.name} color={s.player.color} size={36} />
                    <div>
                      <h4 className="standings-player-name">{s.player.name}</h4>
                      <span className="standings-archetype">{s.archetype}</span>
                    </div>
                  </div>

                  <div className="standings-total-box">
                    <span className="total-score-val">{s.totalScore}</span>
                    <span className="total-score-lbl">Total Score</span>
                  </div>
                </div>

                {/* Team-level metrics (no character ratings exposed) */}
                <div className="metrics-grid">
                  {s.metrics.map(m => (
                    <div key={m.name} className="metric-chip">
                      <div className="metric-header">
                        <span className="metric-name">{m.name}</span>
                        <span className="metric-val">{m.score}/{m.max}</span>
                      </div>
                      <div className="metric-track">
                        <div
                          className="metric-fill"
                          style={{ width: `${Math.round((m.score / m.max) * 100)}%` }}
                        />
                      </div>
                      <span className="metric-sub">{m.description}</span>
                    </div>
                  ))}
                </div>

                {/* Analytical Reason & Best Buy (without points) */}
                <div className="standings-analysis-box">
                  <p className="analysis-reason">{s.reason}</p>
                  {s.bestBuy && (
                    <div className="best-buy-tag">
                      <TrendingUp size={14} className="text-yellow" />
                      <span>Best Buy: <strong>{s.bestBuy.name}</strong> (Acquired at {money(s.bestBuy.price)})</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Story / Status Modal */}
      {showStoryModal && (
        <StoryModal
          scores={scores}
          onClose={() => setShowStoryModal(false)}
        />
      )}
    </div>
  );
};
