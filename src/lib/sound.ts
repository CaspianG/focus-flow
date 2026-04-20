export type SoundTheme = 'dawn' | 'glass';
export type SoundCue = 'focus-started' | 'break-started' | 'session-complete' | 'day-complete';

type SoundProfile = {
  frequencies: number[];
  duration: number;
  gain: number;
  detune?: number;
};

const SOUND_THEMES: Record<SoundTheme, Record<SoundCue, SoundProfile>> = {
  dawn: {
    'focus-started': { frequencies: [392, 523.25], duration: 1.4, gain: 0.08 },
    'break-started': { frequencies: [329.63, 440], duration: 1.3, gain: 0.07 },
    'session-complete': { frequencies: [392, 523.25, 659.25], duration: 1.8, gain: 0.09 },
    'day-complete': { frequencies: [261.63, 392, 523.25, 783.99], duration: 2.2, gain: 0.1 },
  },
  glass: {
    'focus-started': { frequencies: [440, 660], duration: 1.1, gain: 0.06, detune: 5 },
    'break-started': { frequencies: [293.66, 440], duration: 1, gain: 0.055, detune: -4 },
    'session-complete': { frequencies: [369.99, 554.37, 739.99], duration: 1.5, gain: 0.075, detune: 3 },
    'day-complete': { frequencies: [329.63, 493.88, 659.25, 987.77], duration: 2, gain: 0.085, detune: 6 },
  },
};

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioContextClass = window.AudioContext || (window as Window & typeof globalThis).webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  audioContext ??= new AudioContextClass();
  return audioContext;
};

const scheduleTone = (
  context: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  gain: number,
  detune = 0,
) => {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  oscillator.detune.value = detune;

  filter.type = 'lowpass';
  filter.frequency.value = 1600;
  filter.Q.value = 0.9;

  envelope.gain.setValueAtTime(0.0001, startAt);
  envelope.gain.exponentialRampToValueAtTime(gain, startAt + 0.06);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(filter);
  filter.connect(envelope);
  envelope.connect(context.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration);
};

export const playSoundCue = async (cue: SoundCue, theme: SoundTheme, volume: number) => {
  if (volume <= 0) {
    return;
  }

  const context = getAudioContext();
  if (!context) {
    return;
  }

  if (context.state === 'suspended') {
    await context.resume();
  }

  const profile = SOUND_THEMES[theme][cue];
  const baseTime = context.currentTime + 0.03;

  profile.frequencies.forEach((frequency, index) => {
    scheduleTone(
      context,
      frequency,
      baseTime + index * 0.08,
      profile.duration - index * 0.05,
      profile.gain * volume,
      profile.detune ?? 0,
    );
  });
};
