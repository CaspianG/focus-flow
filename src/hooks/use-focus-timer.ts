import { startTransition, useDeferredValue, useEffect, useState } from 'react';
import type { Language } from '../lib/copy';
import {
  type AccountingMode,
  createDailyPlan,
  type DailyPlan,
} from '../lib/session-plan';
import { readJsonStorage, writeJsonStorage } from '../lib/storage';
import { playSoundCue, type SoundCue, type SoundTheme } from '../lib/sound';
import {
  advanceTimer,
  createTimerState,
  getCurrentBlock,
  pauseTimer,
  resetDay,
  resumeTimer,
  skipPhase,
  type TimerEventType,
  type TimerState,
} from '../lib/timer-machine';

export const STORAGE_KEY = 'focus-flow/state/v1';

export const RHYTHM_PRESETS = {
  '50-10': {
    label: '50 / 10',
    focusMinutes: 50,
    breakMinutes: 10,
  },
  '90-15': {
    label: '90 / 15',
    focusMinutes: 90,
    breakMinutes: 15,
  },
} as const;

export type PresetId = keyof typeof RHYTHM_PRESETS;
export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export type FocusPreferences = {
  language: Language;
  presetId: PresetId;
  sessionCount: number;
  sessionHours: number;
  accountingMode: AccountingMode;
  volume: number;
  soundTheme: SoundTheme;
  themeMode: ThemeMode;
};

type PersistedState = {
  preferences: FocusPreferences;
  timerState?: TimerState;
};

const DEFAULT_PREFERENCES: FocusPreferences = {
  language: 'en',
  presetId: '50-10',
  sessionCount: 2,
  sessionHours: 4,
  accountingMode: 'focus-only',
  volume: 0.55,
  soundTheme: 'dawn',
  themeMode: 'system',
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const normalizePreferences = (value: Partial<FocusPreferences> | undefined): FocusPreferences => {
  return {
    language: value?.language === 'ru' ? 'ru' : 'en',
    presetId: value?.presetId === '90-15' ? '90-15' : '50-10',
    sessionCount: clamp(Math.round(value?.sessionCount ?? DEFAULT_PREFERENCES.sessionCount), 1, 12),
    sessionHours:
      Math.round(clamp(value?.sessionHours ?? DEFAULT_PREFERENCES.sessionHours, 0.5, 12) * 4) / 4,
    accountingMode: value?.accountingMode === 'full-session' ? 'full-session' : 'focus-only',
    volume: Math.round(clamp(value?.volume ?? DEFAULT_PREFERENCES.volume, 0, 1) * 100) / 100,
    soundTheme: value?.soundTheme === 'glass' ? 'glass' : 'dawn',
    themeMode:
      value?.themeMode === 'light' || value?.themeMode === 'dark' || value?.themeMode === 'system'
        ? value.themeMode
        : 'system',
  };
};

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const createPlanFromPreferences = (preferences: FocusPreferences) => {
  const preset = RHYTHM_PRESETS[preferences.presetId];

  return createDailyPlan({
    focusMinutes: preset.focusMinutes,
    breakMinutes: preset.breakMinutes,
    sessionCount: preferences.sessionCount,
    sessionHours: preferences.sessionHours,
    accountingMode: preferences.accountingMode,
  });
};

const hasMatchingPlanner = (plan: DailyPlan, preferences: FocusPreferences) => {
  const preset = RHYTHM_PRESETS[preferences.presetId];

  return (
    plan.settings.focusMinutes === preset.focusMinutes &&
    plan.settings.breakMinutes === preset.breakMinutes &&
    plan.settings.sessionCount === preferences.sessionCount &&
    plan.settings.sessionHours === preferences.sessionHours &&
    plan.settings.accountingMode === preferences.accountingMode
  );
};

const hydrateState = (): { preferences: FocusPreferences; timerState: TimerState } => {
  const persisted = readJsonStorage<PersistedState>(STORAGE_KEY, {
    preferences: DEFAULT_PREFERENCES,
  });
  const preferences = normalizePreferences(persisted.preferences);
  const fallbackPlan = createPlanFromPreferences(preferences);
  const fallbackTimerState = createTimerState(fallbackPlan);

  if (!persisted.timerState) {
    return {
      preferences,
      timerState: fallbackTimerState,
    };
  }

  const restoredState = {
    ...persisted.timerState,
    plan: persisted.timerState.plan ?? fallbackPlan,
  } as TimerState;

  const safeState = hasMatchingPlanner(restoredState.plan, preferences)
    ? restoredState
    : fallbackTimerState;

  if (safeState.status === 'running') {
    return {
      preferences,
      timerState: advanceTimer(safeState, Date.now()).state,
    };
  }

  return {
    preferences,
    timerState: safeState,
  };
};

const toCue = (eventType: TimerEventType): SoundCue => {
  switch (eventType) {
    case 'break-started':
      return 'break-started';
    case 'session-complete':
      return 'session-complete';
    case 'day-complete':
      return 'day-complete';
    default:
      return 'focus-started';
  }
};

const formatClock = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const sumElapsedBeforeCurrentBlock = (timerState: TimerState) => {
  const finishedSessions = timerState.plan.sessions.slice(0, timerState.sessionIndex);
  const elapsedFromFinishedSessions = finishedSessions.reduce(
    (total, session) => total + session.elapsedMinutes,
    0,
  );
  const currentSession = timerState.plan.sessions[timerState.sessionIndex];
  const previousBlocks = currentSession?.blocks.slice(0, timerState.blockIndex) ?? [];

  return (
    elapsedFromFinishedSessions +
    previousBlocks.reduce((total, block) => total + block.minutes, 0)
  );
};

export const useFocusTimer = () => {
  const [initialState] = useState(hydrateState);
  const [preferences, setPreferences] = useState(initialState.preferences);
  const [timerState, setTimerState] = useState(initialState.timerState);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);
  const deferredPreferences = useDeferredValue(preferences);
  const previewPlan = createPlanFromPreferences(deferredPreferences);
  const resolvedTheme: ResolvedTheme =
    preferences.themeMode === 'system' ? systemTheme : preferences.themeMode;

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = (matches: boolean) => {
      setSystemTheme(matches ? 'dark' : 'light');
    };
    const handleChange = (event: MediaQueryListEvent) => {
      updateSystemTheme(event.matches);
    };

    updateSystemTheme(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }

    mediaQuery.addListener(handleChange);
    return () => {
      mediaQuery.removeListener(handleChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    document.documentElement.lang = preferences.language;
  }, [preferences.language]);

  useEffect(() => {
    if (timerState.status === 'running') {
      return;
    }

    const nextPlan = createPlanFromPreferences(preferences);
    setTimerState((previous) => {
      if (hasMatchingPlanner(previous.plan, preferences)) {
        return previous;
      }

      return createTimerState(nextPlan);
    });
  }, [
    preferences.accountingMode,
    preferences.language,
    preferences.presetId,
    preferences.sessionCount,
    preferences.sessionHours,
    timerState.status,
  ]);

  const persistedRemaining = timerState.status === 'running' ? 0 : timerState.remainingMs;

  useEffect(() => {
    const snapshot =
      timerState.status === 'running' && timerState.endsAt !== null
        ? {
            ...timerState,
            remainingMs: Math.max(0, timerState.endsAt - Date.now()),
          }
        : timerState;

    writeJsonStorage(STORAGE_KEY, {
      preferences,
      timerState: snapshot,
    } satisfies PersistedState);
  }, [
    preferences,
    persistedRemaining,
    timerState.blockIndex,
    timerState.endsAt,
    timerState.sessionIndex,
    timerState.startedAt,
    timerState.status,
  ]);

  useEffect(() => {
    if (timerState.status !== 'running') {
      return;
    }

    const intervalId = window.setInterval(() => {
      let nextState: TimerState | null = null;
      let nextCue: SoundCue | null = null;

      setTimerState((previous) => {
        const result = advanceTimer(previous, Date.now());
        nextState = result.state;
        nextCue = result.events.length > 0 ? toCue(result.events.at(-1)!.type) : null;
        return result.state;
      });

      if (nextCue) {
        void playSoundCue(nextCue, preferences.soundTheme, preferences.volume);
      }

      if (nextState?.status === 'completed') {
        window.clearInterval(intervalId);
      }
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [preferences.soundTheme, preferences.volume, timerState.status]);

  const currentSession = timerState.plan.sessions[timerState.sessionIndex];
  const currentBlock = getCurrentBlock(timerState);
  const sessionElapsedBeforeCurrentBlock =
    (currentSession?.blocks.slice(0, timerState.blockIndex) ?? []).reduce(
      (total, block) => total + block.minutes,
      0,
    );
  const currentBlockElapsedMinutes =
    ((currentBlock?.minutes ?? 0) * 60_000 - timerState.remainingMs) / 60_000;
  const elapsedMinutes =
    sumElapsedBeforeCurrentBlock(timerState) + currentBlockElapsedMinutes;
  const dayProgress =
    timerState.plan.totals.elapsedMinutes > 0
      ? clamp(elapsedMinutes / timerState.plan.totals.elapsedMinutes, 0, 1)
      : 0;
  const sessionProgress =
    currentSession?.elapsedMinutes
      ? clamp(
          (sessionElapsedBeforeCurrentBlock + currentBlockElapsedMinutes) /
            currentSession.elapsedMinutes,
          0,
          1,
        )
      : 0;

  const playCurrentPhaseCue = (state: TimerState) => {
    const block = getCurrentBlock(state);
    if (!block) {
      return;
    }

    const cue = block.kind === 'break' ? 'break-started' : 'focus-started';
    void playSoundCue(cue, preferences.soundTheme, preferences.volume);
  };

  const setPreference = <K extends keyof FocusPreferences>(key: K, value: FocusPreferences[K]) => {
    startTransition(() => {
      setPreferences((previous) => ({
        ...previous,
        [key]: value,
      }));
    });
  };

  return {
    preferences,
    plan: timerState.plan,
    previewPlan,
    timerState,
    currentBlock,
    currentSession,
    displayTime: formatClock(timerState.remainingMs),
    dayProgress,
    sessionProgress,
    resolvedTheme,
    setLanguage: (language: Language) => setPreference('language', language),
    setPresetId: (presetId: PresetId) => setPreference('presetId', presetId),
    setSessionCount: (sessionCount: number) =>
      setPreference('sessionCount', clamp(Math.round(sessionCount), 1, 12)),
    setSessionHours: (sessionHours: number) =>
      setPreference('sessionHours', Math.round(clamp(sessionHours, 0.5, 12) * 4) / 4),
    setAccountingMode: (accountingMode: AccountingMode) =>
      setPreference('accountingMode', accountingMode),
    setVolume: (volume: number) => setPreference('volume', Math.round(clamp(volume, 0, 1) * 100) / 100),
    setSoundTheme: (soundTheme: SoundTheme) => setPreference('soundTheme', soundTheme),
    setThemeMode: (themeMode: ThemeMode) => setPreference('themeMode', themeMode),
    toggleRunning: () => {
      if (timerState.status === 'running') {
        setTimerState((previous) => pauseTimer(previous, Date.now()).state);
        return;
      }

      let nextState = timerState;
      setTimerState((previous) => {
        const result = resumeTimer(previous, Date.now());
        nextState = result.state;
        return result.state;
      });
      playCurrentPhaseCue(nextState);
    },
    skipPhase: () => {
      let nextCue: SoundCue | null = null;

      setTimerState((previous) => {
        const result = skipPhase(previous, Date.now());
        nextCue = result.events.length > 0 ? toCue(result.events.at(-1)!.type) : null;
        return result.state;
      });

      if (nextCue) {
        void playSoundCue(nextCue, preferences.soundTheme, preferences.volume);
      }
    },
    resetPlanner: () => {
      setTimerState((previous) => resetDay(previous).state);
    },
  };
};
