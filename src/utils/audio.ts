class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public musicEnabled: boolean = false;
  private bgmInterval: ReturnType<typeof setInterval> | null = null;
  private bgmGain: GainNode | null = null;

  constructor() {
    try {
      const savedSound = localStorage.getItem('a20-sound');
      if (savedSound !== null) {
        this.enabled = savedSound === 'true';
      }
      const savedMusic = localStorage.getItem('a20-music');
      if (savedMusic !== null) {
        this.musicEnabled = savedMusic === 'true';
      }
    } catch {
      this.enabled = true;
      this.musicEnabled = false;
    }
  }

  private getContext(): AudioContext | null {
    if (!this.enabled && !this.musicEnabled) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem('a20-sound', String(this.enabled));
    } catch {
      // ignore
    }
    if (!this.enabled && this.musicEnabled) {
      this.stopBgm();
    }
    return this.enabled;
  }

  public toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    try {
      localStorage.setItem('a20-music', String(this.musicEnabled));
    } catch {
      // ignore
    }

    if (this.musicEnabled) {
      this.startBgm();
    } else {
      this.stopBgm();
    }
    return this.musicEnabled;
  }

  public startBgm() {
    const ctx = this.getContext();
    if (!ctx) return;
    this.stopBgm();

    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.04, ctx.currentTime);
    this.bgmGain.connect(ctx.destination);

    // Upbeat Cartoon & Game Show Chords: [C, G, Am, F]
    const chords = [
      [261.63, 329.63, 392.0],  // C major
      [196.00, 246.94, 293.66], // G major
      [220.00, 261.63, 329.63], // A minor
      [174.61, 220.00, 261.63], // F major
    ];

    let step = 0;
    const playMeasure = () => {
      if (!this.musicEnabled || !this.ctx || !this.bgmGain) return;
      const now = this.ctx.currentTime;
      const chord = chords[step % chords.length];
      const bassFreq = chord[0] / 2; // Bass note 1 octave down

      // Play soft bass pulse
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(bassFreq, now);
      bassGain.gain.setValueAtTime(0.06, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      bassOsc.connect(bassGain);
      bassGain.connect(this.bgmGain);
      bassOsc.start(now);
      bassOsc.stop(now + 0.45);

      // Play arpeggiated melodic notes
      chord.forEach((freq, noteIdx) => {
        if (!this.ctx || !this.bgmGain) return;
        const noteTime = now + noteIdx * 0.14;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);
        g.gain.setValueAtTime(0.035, noteTime);
        g.gain.exponentialRampToValueAtTime(0.0005, noteTime + 0.28);
        osc.connect(g);
        g.connect(this.bgmGain);
        osc.start(noteTime);
        osc.stop(noteTime + 0.28);
      });

      step++;
    };

    playMeasure();
    this.bgmInterval = setInterval(playMeasure, 600);
  }

  public stopBgm() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.bgmGain) {
      try {
        this.bgmGain.disconnect();
      } catch {
        // ignore
      }
      this.bgmGain = null;
    }
  }

  public click() {
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }

  public step() {
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  public bid() {
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return;
    const now = ctx.currentTime;
    [520, 780].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0.2, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.08);
    });
  }

  public tension() {
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return;
    const now = ctx.currentTime;
    // Low dramatic suspense hum
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.3);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  public gavel() {
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);

    const bufferSize = ctx.sampleRate * 0.06;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
  }

  public sold() {
    this.gavel();
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return;
    const now = ctx.currentTime + 0.08;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.2, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.35);
    });
  }

  public skip() {
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  public undo() {
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  public drumroll(durationMs = 2200): () => void {
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return () => {};
    let isCancelled = false;
    const startTime = Date.now();

    const playHit = (freq: number, vol: number) => {
      if (isCancelled || !this.enabled) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    };

    let interval = 80;
    const roll = () => {
      if (isCancelled) return;
      const elapsed = Date.now() - startTime;
      if (elapsed >= durationMs) return;
      const progress = elapsed / durationMs;
      const vol = 0.08 + progress * 0.18;
      const freq = 120 + Math.random() * 30;
      playHit(freq, vol);
      interval = Math.max(35, 80 - progress * 45);
      setTimeout(roll, interval);
    };

    roll();
    return () => { isCancelled = true; };
  }

  public fanfare() {
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return;
    const now = ctx.currentTime;
    const notes = [
      { f: 523.25, t: 0.0, d: 0.15 },  // C5
      { f: 523.25, t: 0.15, d: 0.15 }, // C5
      { f: 523.25, t: 0.3, d: 0.15 },  // C5
      { f: 659.25, t: 0.45, d: 0.35 }, // E5
      { f: 783.99, t: 0.8, d: 0.5 },   // G5
      { f: 1046.5, t: 1.3, d: 0.8 },   // C6
    ];

    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      gain.gain.setValueAtTime(0.25, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d);
    });
  }
}

export const sound = new SoundEngine();
