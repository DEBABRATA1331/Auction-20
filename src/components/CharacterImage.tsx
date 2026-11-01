import React, { useState, useEffect } from 'react';
import { Character } from '../types/game';
import { initials } from '../game/rules';

// Direct Wikipedia titles mapping for original character photos
const WIKI_TITLES: Record<string, string> = {
  'bheem-1': 'Chhota Bheem',
  'bheem-2': 'Chhota Bheem',
  'motu-1': 'Motu Patlu',
  'motu-2': 'Motu Patlu',
  'shin-1': 'Shinnosuke Nohara',
  'shin-2': 'Shinnosuke Nohara',
  'shin-4': 'Action Kamen',
  'hat-1': 'Ninja Hattori-kun',
  'oggy-1': 'Oggy and the Cockroaches',
  'oggy-2': 'Oggy and the Cockroaches',
  'dora-1': 'Doraemon (character)',
  'dora-2': 'Nobita Nobi',
  'dora-3': 'Takeshi Goda',
  'dora-4': 'Suneo Honekawa',
  'dora-5': 'Dorami',
  'ben-1': 'Ben Tennyson',
  'ben-2': 'Kevin Levin',
  'ben-3': 'Gwen Tennyson',
  'ben-4': 'Vilgax',
  'poke-1': 'Pikachu',
  'poke-2': 'Charizard',
  'poke-3': 'Mewtwo',
  'poke-4': 'Gengar',
  'poke-5': 'Lucario',
  'tj-1': 'Tom Cat',
  'tj-2': 'Jerry Mouse',
  'tj-3': 'Spike and Tyke',
  'perm-1': 'Perman',
  'kit-1': 'Kiteretsu Daihyakka',
  'henry-1': 'Horrid Henry',
};

// Global memory cache
const memoryCache: Record<string, string | null> = {};

function getCachedUrl(charId: string): string | null | undefined {
  if (memoryCache[charId] !== undefined) return memoryCache[charId];
  try {
    const raw = localStorage.getItem('a20-img-cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[charId] !== undefined) {
        memoryCache[charId] = parsed[charId];
        return parsed[charId];
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

function setCachedUrl(charId: string, url: string | null) {
  memoryCache[charId] = url;
  try {
    const raw = localStorage.getItem('a20-img-cache');
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[charId] = url;
    localStorage.setItem('a20-img-cache', JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

interface CharacterImageProps {
  character: Character;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
}

export const CharacterImage: React.FC<CharacterImageProps> = ({ character, className = '', size = 'md' }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(() => {
    const cached = getCachedUrl(character.id);
    return cached !== undefined ? cached : null;
  });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const cached = getCachedUrl(character.id);
    if (cached !== undefined) {
      setImgSrc(cached);
      return;
    }

    const title = WIKI_TITLES[character.id];
    if (!title) {
      setCachedUrl(character.id, null);
      setFailed(true);
      return;
    }

    // Attempt to fetch Wikipedia article thumbnail
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
      .then(res => {
        if (!res.ok) throw new Error('Wiki fetch failed');
        return res.json();
      })
      .then(data => {
        if (!active) return;
        const source = data.thumbnail?.source || data.originalimage?.source || null;
        setCachedUrl(character.id, source);
        if (source) {
          setImgSrc(source);
        } else {
          setFailed(true);
        }
      })
      .catch(() => {
        if (!active) return;
        setCachedUrl(character.id, null);
        setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [character.id]);

  if (!imgSrc || failed) {
    // Monogram Avatar fallback with character avatarColor
    return (
      <div
        className={`char-monogram size-${size} ${className}`}
        style={{
          background: `radial-gradient(circle at 30% 30%, ${character.avatarColor}dd, #121217 90%)`,
          borderColor: `${character.avatarColor}66`,
        }}
      >
        <span className="char-monogram-text">{initials(character.name)}</span>
        <span className="char-monogram-sub">{character.franchise}</span>
      </div>
    );
  }

  return (
    <div className={`char-img-wrap size-${size} ${className}`}>
      <img
        src={imgSrc}
        alt={character.name}
        className="char-img-element"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
};
