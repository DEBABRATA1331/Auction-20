import React, { useRef, useEffect, useState } from 'react';
import { PlayerScore } from '../types/game';
import { CHAR_BY_ID, money } from '../game/rules';
import { Download, Share2, X, Sparkles, Trophy } from 'lucide-react';
import { sound } from '../utils/audio';

interface StoryModalProps {
  scores: PlayerScore[];
  onClose: () => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({ scores, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [canShare, setCanShare] = useState(false);

  const winner = scores[0];

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanShare(true);
    }
  }, []);

  useEffect(() => {
    if (!winner) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Render 1080 x 1920 Story Card
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // 1. Dark Gradient Background
    const bgGrad = ctx.createRadialGradient(W / 2, 200, 50, W / 2, 800, W * 0.9);
    bgGrad.addColorStop(0, '#2b0f15');
    bgGrad.addColorStop(0.4, '#15101a');
    bgGrad.addColorStop(1, '#09090c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Decorative Red Glow on top
    const glowGrad = ctx.createRadialGradient(W / 2, 350, 0, W / 2, 350, 450);
    glowGrad.addColorStop(0, 'rgba(225, 29, 46, 0.25)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, W, 800);

    // Subtle Outer Frame
    ctx.strokeStyle = 'rgba(255, 194, 26, 0.4)';
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(55, 55, W - 110, H - 110);

    // 2. Brand Header
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffc21a';
    ctx.font = '900 42px Outfit, sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('★ AUCTION 20 ★', W / 2, 140);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '700 24px Outfit, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('CARTOON WARS CHAMPIONSHIP', W / 2, 185);

    // 3. Winner Trophy & Title
    ctx.fillStyle = '#e11d2e';
    ctx.font = '900 32px Outfit, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('OFFICIAL WINNER', W / 2, 270);

    // Winner Name
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 82px Outfit, sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText(winner.player.name.toUpperCase(), W / 2, 370);

    // Archetype
    ctx.fillStyle = '#ffc21a';
    ctx.font = '700 30px Outfit, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText(`“${winner.archetype}”`, W / 2, 425);

    // 4. Score Display Box
    const scoreBoxY = 480;
    const scoreBoxW = 760;
    const scoreBoxH = 220;
    const scoreBoxX = (W - scoreBoxW) / 2;

    ctx.fillStyle = 'rgba(25, 25, 36, 0.85)';
    ctx.strokeStyle = 'rgba(255, 194, 26, 0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '800 24px Outfit, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('TOTAL COMPOSITE SCORE', W / 2, scoreBoxY + 55);

    ctx.fillStyle = '#ffc21a';
    ctx.font = '900 96px Outfit, sans-serif';
    ctx.fillText(winner.totalScore.toFixed(1), W / 2 - 40, scoreBoxY + 155);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '700 34px Outfit, sans-serif';
    ctx.fillText('/ 100', W / 2 + 130, scoreBoxY + 150);

    // Extra Squad Bonus indicator
    if (winner.benchDepth > 0) {
      ctx.fillStyle = '#34d399';
      ctx.font = '700 24px Outfit, sans-serif';
      ctx.fillText(`+${winner.benchDepth.toFixed(1)} Extra Squad Bonus Included`, W / 2, scoreBoxY + 195);
    }

    // 5. Championship Squad Roster (Character names only - NO individual scores!)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 22px Outfit, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('CHAMPIONSHIP SQUAD ROSTER', W / 2, 765);

    const charList = winner.player.roster.map(id => CHAR_BY_ID[id]).filter(Boolean);
    const startY = 810;
    const itemHeight = 65;

    charList.forEach((c, idx) => {
      const y = startY + idx * itemHeight;
      if (y > 1250) return; // avoid overflow

      const isExtra = idx >= 5;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.roundRect(140, y, W - 280, 52, 12);
      ctx.fill();

      // Number / Badge
      ctx.fillStyle = isExtra ? '#ffc21a' : '#e11d2e';
      ctx.font = '800 20px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(isExtra ? `★ BONUS` : `#${idx + 1}`, 165, y + 33);

      // Character Name
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 24px Outfit, sans-serif';
      ctx.fillText(c.name, 280, y + 33);

      // Franchise
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '600 20px Outfit, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(c.franchise, W - 170, y + 33);
    });

    // 6. Overall Standings Mini-Table
    const tableY = 1340;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffc21a';
    ctx.font = '800 26px Outfit, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('FINAL TOURNAMENT STANDINGS', W / 2, tableY);

    scores.forEach((s, idx) => {
      const rowY = tableY + 50 + idx * 72;
      if (rowY > 1750) return;

      const isFirst = idx === 0;
      ctx.fillStyle = isFirst ? 'rgba(255, 194, 26, 0.12)' : 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = isFirst ? '#ffc21a' : 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(140, rowY, W - 280, 58, 12);
      ctx.fill();
      ctx.stroke();

      // Rank
      ctx.textAlign = 'left';
      ctx.fillStyle = isFirst ? '#ffc21a' : '#ffffff';
      ctx.font = '900 26px Outfit, sans-serif';
      ctx.fillText(`#${s.rank}`, 170, rowY + 38);

      // Name
      ctx.font = '700 26px Outfit, sans-serif';
      ctx.fillText(s.player.name, 240, rowY + 38);

      // Spent
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '600 20px Outfit, sans-serif';
      ctx.fillText(`${money(s.player.spent)} spent`, 560, rowY + 38);

      // Total Score
      ctx.textAlign = 'right';
      ctx.fillStyle = isFirst ? '#ffc21a' : '#ffffff';
      ctx.font = '900 28px Outfit, sans-serif';
      ctx.fillText(`${s.totalScore.toFixed(1)} PTS`, W - 170, rowY + 38);
    });

    // 7. Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '600 20px Outfit, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('AUCTION 20 • SCREEN-SHARE CHAMPIONSHIP', W / 2, 1835);

    try {
      const url = canvas.toDataURL('image/png');
      setDataUrl(url);
      setIsGenerating(false);
    } catch {
      setIsGenerating(false);
    }
  }, [winner, scores]);

  const handleDownload = () => {
    sound.sold();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `AUCTION-20-CHAMPION-${winner.player.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    sound.click();
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async blob => {
        if (!blob) return;
        const file = new File([blob], `AUCTION_20_CHAMPION.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `AUCTION 20 Champion: ${winner.player.name}!`,
            text: `🏆 ${winner.player.name} won AUCTION 20 with ${winner.totalScore} PTS!`,
            files: [file],
          });
        } else {
          handleDownload();
        }
      });
    } catch {
      handleDownload();
    }
  };

  return (
    <div className="story-modal-backdrop" onClick={onClose}>
      <div className="story-modal-card" onClick={e => e.stopPropagation()}>
        <div className="story-modal-header">
          <div className="story-modal-title-group">
            <Trophy size={20} className="text-yellow" />
            <h3 className="story-modal-title">Shareable Story / Status</h3>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <p className="story-modal-subtitle">
          9:16 high-resolution card formatted for WhatsApp Status and Instagram Story.
        </p>

        {/* Hidden Canvas used to generate image */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Live Preview Container */}
        <div className="story-preview-container">
          {isGenerating ? (
            <div className="story-loading-state">
              <Sparkles size={32} className="text-yellow spin" />
              <span>Rendering 1080x1920 Story Card...</span>
            </div>
          ) : dataUrl ? (
            <img src={dataUrl} alt="Story Card Preview" className="story-preview-img" />
          ) : null}
        </div>

        {/* Action buttons */}
        <div className="story-modal-actions">
          <button type="button" className="btn btn-red btn-lg" onClick={handleDownload}>
            <Download size={18} />
            <span>Download PNG</span>
          </button>

          {canShare && (
            <button type="button" className="btn btn-yellow btn-lg" onClick={handleShare}>
              <Share2 size={18} />
              <span>Share Status</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
