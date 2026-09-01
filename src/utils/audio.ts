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

  playFanfare() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 523.25, 523.25, 659.25, 783.99, 1046.5]; // C5 C5 C5 E5 G5 C6 (Victory Fanfare)
      const times = [0, 0.12, 0.24, 0.36, 0.48, 0.65];
      const durations = [0.1, 0.1, 0.1, 0.1, 0.15, 0.8];
      const now = this.ctx.currentTime;
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + times[i]);
        gain.gain.setValueAtTime(0.18, now + times[i]);
        gain.gain.exponentialRampToValueAtTime(0.001, now + times[i] + durations[i]);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + times[i]);
        osc.stop(now + times[i] + durations[i]);
      });
    } catch {
      // Ignore
    }
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
