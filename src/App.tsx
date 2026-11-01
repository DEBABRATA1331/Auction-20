import React, { useState, useEffect } from 'react';
import { Player, ActionLog } from './types/game';
import { CHARACTERS_DATABASE } from './data/characters';
import { shuffle } from './game/rules';
import { sound } from './utils/audio';
import { Header } from './components/Header';
import { PlayersStep } from './components/PlayersStep';
import { AuctionStep } from './components/AuctionStep';
import { TeamsStep } from './components/TeamsStep';
import { ResultsStep } from './components/ResultsStep';

const STORAGE_KEY = 'auction20-game-v2';

interface SavedState {
  step: number;
  players: Player[];
  deck: string[];
  lotIndex: number;
  skipped: string[];
  history: ActionLog[];
}

export const App: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sound.enabled);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(sound.musicEnabled);

  // Initialize state from localStorage or fresh empty state
  const [step, setStep] = useState<number>(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [deck, setDeck] = useState<string[]>(() => shuffle(CHARACTERS_DATABASE.map(c => c.id)));
  const [lotIndex, setLotIndex] = useState<number>(0);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [history, setHistory] = useState<ActionLog[]>([]);

  // Load saved state on initial mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: SavedState = JSON.parse(raw);
        if (saved && Array.isArray(saved.players)) {
          setStep(saved.step || 0);
          setPlayers(saved.players);
          if (Array.isArray(saved.deck) && saved.deck.length > 0) setDeck(saved.deck);
          setLotIndex(saved.lotIndex || 0);
          setSkipped(saved.skipped || []);
          setHistory(saved.history || []);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save state on updates
  useEffect(() => {
    try {
      const stateToSave: SavedState = {
        step,
        players,
        deck,
        lotIndex,
        skipped,
        history,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // ignore
    }
  }, [step, players, deck, lotIndex, skipped, history]);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const handleToggleSound = () => {
    const next = sound.toggle();
    setSoundEnabled(next);
  };

  const handleToggleMusic = () => {
    const next = sound.toggleMusic();
    setMusicEnabled(next);
  };

  const handleResetGame = () => {
    if (window.confirm('Reset the current auction and start fresh?')) {
      sound.click();
      setStep(0);
      setLotIndex(0);
      setSkipped([]);
      setHistory([]);
      setDeck(shuffle(CHARACTERS_DATABASE.map(c => c.id)));
      setPlayers(prev =>
        prev.map(p => ({
          ...p,
          spent: 0,
          roster: [],
          prices: {},
          active: [],
        }))
      );
    }
  };

  const canNavigateToStep = (targetStep: number): boolean => {
    if (targetStep === 0) return true;
    if (targetStep === 1) return players.length >= 2;
    if (targetStep === 2) return players.every(p => p.roster.length >= 5);
    if (targetStep === 3) return players.every(p => p.roster.length >= 5 && p.active && p.active.length === 5);
    return false;
  };

  return (
    <div className="app-root">
      <Header
        currentStep={step}
        onSelectStep={setStep}
        canNavigateToStep={canNavigateToStep}
        soundEnabled={soundEnabled}
        musicEnabled={musicEnabled}
        onToggleSound={handleToggleSound}
        onToggleMusic={handleToggleMusic}
        onResetGame={handleResetGame}
      />

      <main className="main-content">
        {step === 0 && (
          <PlayersStep
            players={players}
            onUpdatePlayers={setPlayers}
            onNext={() => setStep(1)}
          />
        )}

        {step === 1 && (
          <AuctionStep
            players={players}
            deck={deck}
            lotIndex={lotIndex}
            skipped={skipped}
            history={history}
            onUpdatePlayers={setPlayers}
            onUpdateDeck={setDeck}
            onUpdateLotIndex={setLotIndex}
            onUpdateSkipped={setSkipped}
            onUpdateHistory={setHistory}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <TeamsStep
            players={players}
            onUpdatePlayers={setPlayers}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <ResultsStep
            players={players}
            onResetGame={handleResetGame}
          />
        )}
      </main>
    </div>
  );
};

export default App;
