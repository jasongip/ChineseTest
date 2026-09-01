// Sound and Speech Synthesis utilities for Cantonese assessment

class AudioManager {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playSuccess() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
      osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.3); // C6

      osc2.frequency.setValueAtTime(261.63, now);
      osc2.frequency.exponentialRampToValueAtTime(523.25, now + 0.3);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch {
      // Audio context might be restricted
    }
  }

  playClick() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore
    }
  }

  playPop() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Ignore
    }
  }

  playError() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.1);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Ignore
    }
  }

  playCelebration() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      const now = this.ctx.currentTime;
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.4);
      });
    } catch {
      // Ignore
    }
  }

  // Classic Pokemon-style Attack Sound Effect (Tackle / Slash / Zap / Elemental Hit)
  playPokemonAttack(type: string = '普通', isStrong: boolean = false) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Noise burst for physical impact crunch (tackle / hit sound)
      const bufferSize = this.ctx.sampleRate * 0.12;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = type === '電' ? 'highpass' : type === '火' ? 'bandpass' : 'lowpass';
      filter.frequency.setValueAtTime(type === '電' ? 1800 : 800, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.12);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(isStrong ? 0.22 : 0.15, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      whiteNoise.start(now);

      // 2. Chiptune Retro Square/Saw wave pitch drop & punch
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = type === '電' ? 'sawtooth' : 'square';

      const startFreq = type === '電' ? 950 : type === '超能力' ? 1200 : 550;
      const endFreq = 70;

      osc.frequency.setValueAtTime(startFreq, now);
      // Rapid stepped frequency drop mimicking GameBoy sound chip
      osc.frequency.exponentialRampToValueAtTime(startFreq * 0.6, now + 0.03);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.15);

      oscGain.gain.setValueAtTime(isStrong ? 0.18 : 0.12, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);

      // 3. Extra second hit layer for strong / ultimate attacks
      if (isStrong) {
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(320, now + 0.05);
        osc2.frequency.exponentialRampToValueAtTime(45, now + 0.2);
        gain2.gain.setValueAtTime(0.2, now + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + 0.05);
        osc2.stop(now + 0.2);
      }
    } catch {
      // Ignore
    }
  }

  // Classic Pokemon Faint Sound Effect (Descending stepped slide + collapse thud)
  playPokemonFaint() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Descending stepped glissando (classic Game Boy faint)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';

      const steps = [440, 392, 349, 311, 277, 246, 220, 196, 164, 130, 98, 65];
      const stepDuration = 0.045; // ~0.55s total

      steps.forEach((freq, idx) => {
        osc.frequency.setValueAtTime(freq, now + idx * stepDuration);
      });

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.setValueAtTime(0.14, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + steps.length * stepDuration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + steps.length * stepDuration);

      // Low impact thud when Pokemon collapses
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      const thudTime = now + (steps.length - 2) * stepDuration;
      thudOsc.type = 'triangle';
      thudOsc.frequency.setValueAtTime(110, thudTime);
      thudOsc.frequency.exponentialRampToValueAtTime(35, thudTime + 0.25);

      thudGain.gain.setValueAtTime(0.2, thudTime);
      thudGain.gain.exponentialRampToValueAtTime(0.001, thudTime + 0.25);

      thudOsc.connect(thudGain);
      thudGain.connect(this.ctx.destination);
      thudOsc.start(thudTime);
      thudOsc.stop(thudTime + 0.25);
    } catch {
      // Ignore
    }
  }

  // Classic Pokemon Victory Fanfare (Iconic 5-7 note triumphant theme)
  playPokemonVictoryFanfare() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Iconic victory melody: G4 -> C5 -> E5 -> G5 -> E5 -> G5 -> C6 (long hold)
      // Notes with timing & duration
      const fanfareNotes = [
        { freq: 392.0, time: 0.00, dur: 0.12 },  // G4
        { freq: 523.25, time: 0.13, dur: 0.12 }, // C5
        { freq: 659.25, time: 0.26, dur: 0.12 }, // E5
        { freq: 783.99, time: 0.39, dur: 0.18 }, // G5
        { freq: 659.25, time: 0.58, dur: 0.12 }, // E5
        { freq: 783.99, time: 0.71, dur: 0.18 }, // G5
        { freq: 1046.5, time: 0.90, dur: 0.90 }, // C6 (Triumphant sustained finish)
      ];

      fanfareNotes.forEach(({ freq, time, dur }) => {
        // Lead melody (Crisp Square / Triangle Chiptune)
        const leadOsc = this.ctx!.createOscillator();
        const leadGain = this.ctx!.createGain();
        leadOsc.type = 'triangle';
        leadOsc.frequency.setValueAtTime(freq, now + time);

        leadGain.gain.setValueAtTime(0.18, now + time);
        leadGain.gain.setValueAtTime(0.16, now + time + dur * 0.7);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        leadOsc.connect(leadGain);
        leadGain.connect(this.ctx!.destination);

        leadOsc.start(now + time);
        leadOsc.stop(now + time + dur);

        // Harmony / Bass accompaniment
        const bassOsc = this.ctx!.createOscillator();
        const bassGain = this.ctx!.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(freq / 2, now + time);

        bassGain.gain.setValueAtTime(0.12, now + time);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx!.destination);

        bassOsc.start(now + time);
        bassOsc.stop(now + time + dur);
      });
    } catch {
      // Ignore
    }
  }

  playFanfare() {
    this.playPokemonVictoryFanfare();
  }

  playCardOpen() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Magical sparkling sweep
      for (let i = 0; i < 8; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const freq = 400 + i * 200;
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.08, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.3);
      }
    } catch {
      // Ignore
    }
  }
}

export const audioService = new AudioManager();

export type VoiceEngineType = 'auto' | 'cloud_hk' | 'native_ios' | 'native_web';

export interface VoiceConfig {
  engine: VoiceEngineType;
  speed: number;
  pitch: number;
}

const STORAGE_KEY_VOICE_CONFIG = 'cantonese_voice_engine_config_v2';

export function getVoiceConfig(): VoiceConfig {
  if (typeof window === 'undefined') {
    return { engine: 'auto', speed: 0.88, pitch: 1.02 };
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY_VOICE_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.engine) {
        return parsed;
      }
    }
  } catch {}
  return { engine: 'auto', speed: 0.88, pitch: 1.02 };
}

export function saveVoiceConfig(config: VoiceConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_VOICE_CONFIG, JSON.stringify(config));
  } catch {}
}

export function getSystemVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  try {
    return window.speechSynthesis.getVoices() || [];
  } catch {
    return [];
  }
}

// Speech Synthesis for Cantonese (zh-HK / yue-HK / zh-YUE)
export function getCantoneseVoice(): SpeechSynthesisVoice | null {
  const voices = getSystemVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Strict Cantonese voice check (iOS Safari, Mac, Chrome, Edge)
  const cantoneseVoice = voices.find((v) => {
    const lang = (v.lang || '').toLowerCase().replace('_', '-');
    const name = (v.name || '').toLowerCase();

    if (
      lang === 'zh-hk' ||
      lang === 'yue-hk' ||
      lang === 'zh-yue' ||
      lang === 'yue-hant-hk' ||
      lang.startsWith('yue')
    ) {
      return true;
    }
    // Apple iOS / iPadOS Cantonese voices (Sin-ji, Hiuyu, Tracy, Danny, Cantonese)
    if (
      name.includes('cantonese') ||
      name.includes('hong kong') ||
      name.includes('廣東話') ||
      name.includes('粵語') ||
      name.includes('sin-ji') ||
      name.includes('sinji') ||
      name.includes('hiuyu') ||
      name.includes('tracy') ||
      name.includes('danny')
    ) {
      return true;
    }
    return false;
  });

  if (cantoneseVoice) return cantoneseVoice;

  // 2. Secondary check for zh-HK in lang string
  const secondaryVoice = voices.find((v) => {
    const lang = (v.lang || '').toLowerCase().replace('_', '-');
    return lang.includes('zh-hk') || lang.includes('yue');
  });

  return secondaryVoice || null;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    try {
      window.speechSynthesis.getVoices();
    } catch {}
  };
}

let activeAudioElement: HTMLAudioElement | null = null;

// Play cloud-based Cantonese audio (Google TTS endpoint / 100% works on any OS/browser)
export function playCloudCantoneseAudio(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined') {
    if (onEnd) onEnd();
    return;
  }

  // Stop previous audio
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {}
    activeAudioElement = null;
  }

  try {
    const encoded = encodeURIComponent(text.trim());
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-HK&client=tw-ob&q=${encoded}`;
    const audio = new Audio(audioUrl);
    activeAudioElement = audio;

    let hasEnded = false;
    const finish = () => {
      if (!hasEnded) {
        hasEnded = true;
        activeAudioElement = null;
        if (onEnd) onEnd();
      }
    };

    audio.onended = finish;
    audio.onerror = () => {
      // If error occurs, call onEnd
      finish();
    };

    // Auto timeout safety
    setTimeout(finish, 6000);

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        finish();
      });
    }
  } catch {
    if (onEnd) onEnd();
  }
}

export function speakCantonese(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined') {
    if (onEnd) onEnd();
    return;
  }

  const cleanText = text.replace(/[\n\r]/g, ' ').trim();
  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }

  const config = getVoiceConfig();

  // If Cloud Engine is selected directly:
  if (config.engine === 'cloud_hk') {
    playCloudCantoneseAudio(cleanText, onEnd);
    return;
  }

  // If browser doesn't have Web Speech API:
  if (!('speechSynthesis' in window)) {
    playCloudCantoneseAudio(cleanText, onEnd);
    return;
  }

  try {
    const cantoneseVoice = getCantoneseVoice();

    // If on Auto or no Cantonese voice installed in OS, seamlessly fallback to cloud audio
    if (!cantoneseVoice && (config.engine === 'auto' || config.engine === 'native_ios')) {
      playCloudCantoneseAudio(cleanText, onEnd);
      return;
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'zh-HK';
    utterance.rate = config.speed || 0.88;
    utterance.pitch = config.pitch || 1.02;

    if (cantoneseVoice) {
      utterance.voice = cantoneseVoice;
      utterance.lang = cantoneseVoice.lang || 'zh-HK';
    }

    let completed = false;
    const handleEnd = () => {
      if (!completed) {
        completed = true;
        if (onEnd) onEnd();
      }
    };

    utterance.onend = handleEnd;
    utterance.onerror = () => {
      // If native fails, fallback to cloud audio
      if (config.engine === 'auto') {
        playCloudCantoneseAudio(cleanText, onEnd);
      } else {
        handleEnd();
      }
    };

    // Native speak
    window.speechSynthesis.speak(utterance);

    // Timeout safety fallback
    if (config.engine === 'auto') {
      setTimeout(() => {
        if (!window.speechSynthesis.speaking && !completed) {
          // In case speech synthesis hung silently without playing
          handleEnd();
        }
      }, 5000);
    }
  } catch {
    playCloudCantoneseAudio(cleanText, onEnd);
  }
}
