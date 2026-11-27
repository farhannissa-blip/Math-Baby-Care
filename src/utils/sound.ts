// Audio Manager for MY LITTLE BABY – MATH & CARE ADVENTURE
// Uses the official Acoustic Lullaby Version Audio track for background music (BGM)
// at a soft, gentle volume and Web Audio API synthesizer for responsive baby & UI sound effects (SFX)

export const BGM_AUDIO_SRC = '/assets/aistudio/Acoustic_Lullaby_Version_Audio__1__3aebe007.wav';
// Gentle master attenuation factor so the background lullaby is always soft and never overpowering
const BGM_MASTER_GAIN_MULTIPLIER = 0.35;

export interface AudioSettings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume: number; // 0 to 1
  sfxVolume: number;   // 0 to 1
  muted: boolean;
}

class SoundManager {
  private ctx: AudioContext | null = null;
  private bgmAudio: HTMLAudioElement | null = null;
  private unlockListenersAttached = false;
  private settings: AudioSettings = {
    musicEnabled: true,
    sfxEnabled: true,
    musicVolume: 0.14,
    sfxVolume: 0.65,
    muted: false,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.attachAutoplayUnlockListeners();
    }
  }

  private getEffectiveBgmVolume(): number {
    return this.clampVolume(this.settings.musicVolume * BGM_MASTER_GAIN_MULTIPLIER);
  }

  private getBgmAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.bgmAudio) {
      const audio = new Audio(BGM_AUDIO_SRC);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = this.shouldPlayMusic() ? this.getEffectiveBgmVolume() : 0;
      audio.muted = !this.shouldPlayMusic();
      this.bgmAudio = audio;
    }
    return this.bgmAudio;
  }

  private clampVolume(vol: number): number {
    if (!Number.isFinite(vol)) return 0.12;
    return Math.max(0, Math.min(1, vol));
  }

  private shouldPlayMusic(): boolean {
    return !this.settings.muted && this.settings.musicEnabled && this.settings.musicVolume > 0;
  }

  private attachAutoplayUnlockListeners() {
    if (this.unlockListenersAttached || typeof window === 'undefined') return;
    this.unlockListenersAttached = true;

    const unlockHandler = () => {
      if (this.shouldPlayMusic()) {
        this.startMusic();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    };

    window.addEventListener('pointerdown', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });
    window.addEventListener('touchstart', unlockHandler, { passive: true });
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public updateSettings(newSettings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    const audio = this.getBgmAudio();
    if (audio) {
      audio.volume = this.getEffectiveBgmVolume();
      audio.muted = !this.shouldPlayMusic();
    }

    if (!this.shouldPlayMusic()) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  public getSettings(): AudioSettings {
    return this.settings;
  }

  private canPlaySfx(): boolean {
    return !this.settings.muted && this.settings.sfxEnabled && this.settings.sfxVolume > 0;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    delay = 0,
    volScale = 1,
    slideToFreq?: number
  ) {
    // Also ensure BGM is running if unlocked by user action
    if (this.shouldPlayMusic() && this.bgmAudio && this.bgmAudio.paused) {
      this.bgmAudio.play().catch(() => {});
    }

    if (!this.canPlaySfx()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(slideToFreq, now + duration);
    }

    const peakGain = Math.min(0.4, this.settings.sfxVolume * 0.3 * volScale);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // Play Acoustic Lullaby Audio backsound loop at gentle volume
  public startMusic() {
    this.attachAutoplayUnlockListeners();
    if (!this.shouldPlayMusic()) return;

    const audio = this.getBgmAudio();
    if (!audio) return;

    audio.volume = this.getEffectiveBgmVolume();
    audio.muted = false;

    if (audio.paused) {
      audio.play().catch(() => {
        // Browser autoplay policy waiting for first user interaction;
        // attachAutoplayUnlockListeners will start playback on first tap/click.
      });
    }
  }

  public stopMusic() {
    if (this.bgmAudio && !this.bgmAudio.paused) {
      this.bgmAudio.pause();
    }
  }

  // UI Button Click
  public playClick() {
    this.playTone(620, 0.07, 'sine', 0, 0.7, 780);
  }

  // Soft Pop / Object Tap & Bounce
  public playPop() {
    this.playTone(540, 0.06, 'sine', 0, 0.75, 880);
  }

  // Alias for Baby Laugh / Giggle
  public playLaugh() {
    this.playBabyLaugh();
  }

  // Baby Laugh / Giggle
  public playBabyLaugh() {
    this.playTone(580, 0.11, 'sine', 0, 0.9, 760);
    this.playTone(640, 0.11, 'sine', 0.12, 0.9, 860);
    this.playTone(720, 0.16, 'sine', 0.24, 1.0, 940);
  }

  // Baby Babble / Coo
  public playBabyBabble() {
    this.playTone(480, 0.14, 'sine', 0, 0.8, 620);
    this.playTone(620, 0.16, 'sine', 0.15, 0.8, 520);
  }

  // Baby Cry (gentle fuss)
  public playBabyCry() {
    this.playTone(460, 0.22, 'triangle', 0, 0.7, 360);
    this.playTone(430, 0.26, 'triangle', 0.25, 0.7, 330);
  }

  // Baby Drink / Eat
  public playEatDrink() {
    this.playTone(420, 0.09, 'sine', 0, 0.8, 560);
    this.playTone(460, 0.09, 'sine', 0.12, 0.8, 620);
    this.playTone(540, 0.12, 'sine', 0.24, 0.9, 700);
  }

  // Baby Sleep Chime
  public playSleepChime() {
    this.playTone(659.25, 0.25, 'sine', 0, 0.6);
    this.playTone(587.33, 0.25, 'sine', 0.22, 0.6);
    this.playTone(523.25, 0.4, 'sine', 0.44, 0.7);
  }

  // Bath Bubbles Splash
  public playSplash() {
    this.playTone(500, 0.08, 'sine', 0, 0.7, 850);
    this.playTone(620, 0.08, 'sine', 0.09, 0.7, 980);
    this.playTone(740, 0.1, 'sine', 0.18, 0.8, 1120);
  }

  // Light Cooking Sizzle & Bubbling
  public playSizzle() {
    this.playTone(380, 0.07, 'triangle', 0, 0.55, 520);
    this.playTone(440, 0.07, 'triangle', 0.08, 0.55, 610);
    this.playTone(510, 0.09, 'sine', 0.16, 0.6, 720);
  }

  // Coin Clink
  public playCoin() {
    this.playTone(987.77, 0.09, 'sine', 0, 0.9);
    this.playTone(1318.51, 0.24, 'sine', 0.08, 1.0);
  }

  // Correct Answer Fanfare
  public playCorrect() {
    this.playTone(523.25, 0.1, 'triangle', 0, 0.9);
    this.playTone(659.25, 0.1, 'triangle', 0.09, 0.9);
    this.playTone(783.99, 0.12, 'triangle', 0.18, 0.95);
    this.playTone(1046.5, 0.28, 'triangle', 0.27, 1.0);
  }

  // Wrong Answer Gentle Tone
  public playWrong() {
    this.playTone(349.23, 0.16, 'triangle', 0, 0.75);
    this.playTone(293.66, 0.26, 'triangle', 0.16, 0.75);
  }

  // Surprise Gift Open
  public playSurprise() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((n, i) => {
      this.playTone(n, 0.16, 'triangle', i * 0.08, 1.0);
    });
  }

  // Level Up Fanfare
  public playLevelUp() {
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((n, i) => {
      this.playTone(n, 0.18, 'triangle', i * 0.09, 1.0);
    });
  }

  // Authentic Bamboo Angklung Shaking Tremolo (twin-tube octave bamboo resonance)
  public playAngklungNote(noteIndex = 0) {
    // Sundanese / Nusantara warm pentatonic scale (C5, D5, E5, G5, A5, C6)
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const baseFreq = scale[((noteIndex % scale.length) + scale.length) % scale.length];
    // Rapid bamboo rattle tremolo (6 rapid wooden strikes ~42ms apart)
    for (let i = 0; i < 6; i++) {
      const delay = i * 0.044;
      const gain = i === 0 ? 0.95 : Math.max(0.42, 0.88 - i * 0.08);
      // Lower hollow bamboo tube
      this.playTone(baseFreq, 0.065, 'triangle', delay, gain);
      // Upper octave bamboo tube shimmer
      this.playTone(baseFreq * 2, 0.05, 'sine', delay + 0.008, gain * 0.42);
    }
  }

  // Joyful 4-note Angklung Melody Phrase
  public playAngklungMelody() {
    [0, 2, 3, 4].forEach((noteIdx, i) => {
      window.setTimeout(() => {
        this.playAngklungNote(noteIdx);
      }, i * 320);
    });
  }

  // Warm Traditional Javanese/Nusantara Gamelan Dance Accompaniment
  public playGamelanDance() {
    // Deep warm Gong resonance + bright Saron/Bonang pentatonic shimmer
    this.playTone(146.83, 0.72, 'sine', 0, 0.75, 142);
    const notes = [587.33, 659.25, 783.99, 987.77, 783.99, 1174.66];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.24, 'triangle', i * 0.16, 0.72);
      this.playTone(freq * 1.5, 0.14, 'sine', i * 0.16 + 0.01, 0.22);
    });
  }
}

export const sound = new SoundManager();
