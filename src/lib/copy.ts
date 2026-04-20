import type { AccountingMode, BlockKind, PlannedSession, SessionBlock } from './session-plan';

export type Language = 'en' | 'ru';
export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type SessionTone = 'done' | 'active' | 'queued';
export type PlatformId = 'darwin' | 'win32' | 'linux' | undefined;

type ChoiceCopy = {
  label: string;
  detail: string;
};

export type AppCopy = {
  formatDuration: (minutes: number) => string;
  formatSessionWord: (count: number) => string;
  describeMode: (mode: AccountingMode) => string;
  describePhase: (kind: BlockKind | undefined, status: string) => string;
  describePhaseDetail: (kind: BlockKind | undefined, minutes: number | undefined) => string;
  describeThemeSelection: (themeMode: ThemeMode, resolvedTheme: ResolvedTheme) => string;
  blockSequence: (blocks: SessionBlock[]) => string;
  sessionState: (tone: SessionTone) => string;
  sessionLabel: (index: number) => string;
  sessionFocusTitle: (session: PlannedSession) => string;
  sessionDetail: (session: PlannedSession) => string;
  currentSessionProgress: (currentIndex: number, total: number, status: string) => string;
  dayProgressSummary: (sessionCount: number, totalMinutes: number) => string;
  scenarioHeading: (sessionCount: number, sessionHours: number) => string;
  presetDescription: (focusMinutes: number, breakMinutes: number) => string;
  platform: (platformId: PlatformId) => string;
  brandCopy: (presetLabel: string) => string;
  buttons: {
    settings: string;
    close: string;
    start: string;
    pause: string;
    resume: string;
    newDay: string;
    skipPhase: string;
    reset: string;
  };
  progress: {
    currentSession: string;
    dailyPlan: string;
    allSessionsCompleted: string;
  };
  planner: {
    kicker: string;
    title: string;
    sessionsToday: string;
    hoursInSession: string;
    pureFocus: string;
    includingBreaks: string;
    perSession: string;
    totalToday: string;
    accounting: string;
    accordingToPreset: string;
    withBreaksAndTransitions: string;
    countingMode: string;
  };
  scenario: {
    kicker: string;
  };
  settings: {
    kicker: string;
    title: string;
    languageTitle: string;
    languageCurrent: string;
    themeTitle: string;
    themeCurrent: string;
    volumeTitle: string;
    volumeLevel: (volume: number) => string;
    soundTitle: string;
    accountingTitle: string;
    accountingFocusOnly: ChoiceCopy;
    accountingFullSession: ChoiceCopy;
  };
  languageOptions: Record<Language, ChoiceCopy>;
  themeOptions: Record<ThemeMode, ChoiceCopy>;
  soundThemeOptions: Record<'dawn' | 'glass', ChoiceCopy>;
};

const formatDurationEnglish = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${remainingMinutes}m`;
};

const formatDurationRussian = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}ч ${remainingMinutes}м`;
  }

  if (hours > 0) {
    return `${hours}ч`;
  }

  return `${remainingMinutes}м`;
};

const formatSessionWordEnglish = (count: number) => {
  return count === 1 ? 'session' : 'sessions';
};

const formatSessionWordRussian = (count: number) => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return 'сессия';
  }

  if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
    return 'сессии';
  }

  return 'сессий';
};

const blockSequence = (blocks: SessionBlock[]) => {
  return blocks.map((block) => block.minutes).join(' • ');
};

const englishCopy: AppCopy = {
  formatDuration: formatDurationEnglish,
  formatSessionWord: formatSessionWordEnglish,
  describeMode: (mode) => {
    return mode === 'focus-only' ? 'Pure focus time' : 'Full session length';
  },
  describePhase: (kind, status) => {
    if (status === 'completed') {
      return 'Today is complete';
    }

    return kind === 'break' ? 'Gentle break' : 'Deep work';
  },
  describePhaseDetail: (kind, minutes) => {
    if (!minutes) {
      return 'Build the next workday and start a fresh cycle whenever you are ready.';
    }

    if (kind === 'break') {
      return `You are now on a ${minutes}-minute recovery break with a calm handoff sound.`;
    }

    return `You are currently in a ${minutes}-minute focus block with a soft audio marker at each phase change.`;
  },
  describeThemeSelection: (themeMode, resolvedTheme) => {
    if (themeMode === 'system') {
      return resolvedTheme === 'dark' ? 'System · dark' : 'System · light';
    }

    return themeMode === 'dark' ? 'Dark theme' : 'Light theme';
  },
  blockSequence,
  sessionState: (tone) => {
    switch (tone) {
      case 'done':
        return 'Finished';
      case 'active':
        return 'Now';
      default:
        return 'Queued';
    }
  },
  sessionLabel: (index) => `Session ${index + 1}`,
  sessionFocusTitle: (session) => `${formatDurationEnglish(session.focusMinutes)} focus`,
  sessionDetail: (session) =>
    `${formatDurationEnglish(session.elapsedMinutes)} with breaks • ${session.blocks.length} phases`,
  currentSessionProgress: (currentIndex, total, status) => {
    if (status === 'completed') {
      return 'All sessions completed';
    }

    return `Session ${currentIndex} of ${total}`;
  },
  dayProgressSummary: (sessionCount, totalMinutes) =>
    `${sessionCount} ${formatSessionWordEnglish(sessionCount)} • ${formatDurationEnglish(totalMinutes)} total rhythm`,
  scenarioHeading: (sessionCount, sessionHours) =>
    `${sessionCount} ${formatSessionWordEnglish(sessionCount)} × ${formatDurationEnglish(
      Math.round(sessionHours * 60),
    )}`,
  presetDescription: (focusMinutes, breakMinutes) =>
    `${focusMinutes} min focus • ${breakMinutes} min break`,
  platform: (platformId) => {
    if (platformId === 'darwin') return 'macOS';
    if (platformId === 'win32') return 'Windows';
    if (platformId === 'linux') return 'Linux';
    return 'Desktop';
  },
  brandCopy: (presetLabel) =>
    `A calm, modern desktop rhythm for deep sessions ${presetLabel}`,
  buttons: {
    settings: 'Settings',
    close: 'Close',
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    newDay: 'New day',
    skipPhase: 'Skip phase',
    reset: 'Reset',
  },
  progress: {
    currentSession: 'Current session',
    dailyPlan: 'Today’s plan',
    allSessionsCompleted: 'All sessions completed',
  },
  planner: {
    kicker: 'Day planner',
    title: 'Shape the rhythm you need without the noise',
    sessionsToday: 'Sessions today',
    hoursInSession: 'Hours per session',
    pureFocus: 'Pure focus',
    includingBreaks: 'Including breaks',
    perSession: 'Per session',
    totalToday: 'Total today',
    accounting: 'Accounting',
    accordingToPreset: 'Based on your current preset',
    withBreaksAndTransitions: 'Including breaks and handoffs',
    countingMode: 'Counting mode',
  },
  scenario: {
    kicker: 'Day flow',
  },
  settings: {
    kicker: 'Atmosphere and sound',
    title: 'Fine-tune the experience',
    languageTitle: 'Interface language',
    languageCurrent: 'Current language',
    themeTitle: 'Interface theme',
    themeCurrent: 'Currently active',
    volumeTitle: 'Cue volume',
    volumeLevel: (volume) => `${Math.round(volume * 100)}% cue softness`,
    soundTitle: 'Cue character',
    accountingTitle: 'Session counting',
    accountingFocusOnly: {
      label: 'Pure focus time',
      detail: 'Example: 4 hours means four hours of work, with breaks added on top.',
    },
    accountingFullSession: {
      label: 'Full cycle',
      detail: 'Example: 4 hours already includes both focus blocks and breaks.',
    },
  },
  languageOptions: {
    en: {
      label: 'English',
      detail: 'Default for new installs and the primary language for the GitHub release.',
    },
    ru: {
      label: 'Russian',
      detail: 'A full Russian UI for people who prefer planning and timing in Russian.',
    },
  },
  themeOptions: {
    light: {
      label: 'Light',
      detail: 'Airy, soft and calm for daytime work sessions.',
    },
    dark: {
      label: 'Dark',
      detail: 'Graphite glass with a warmer accent and quieter glow.',
    },
    system: {
      label: 'System',
      detail: 'Follows your operating system theme automatically.',
    },
  },
  soundThemeOptions: {
    dawn: {
      label: 'Dawn',
      detail: 'Warm, a little more organic, and softly musical.',
    },
    glass: {
      label: 'Glass',
      detail: 'Cleaner, cooler, and more crystal-like.',
    },
  },
};

const russianCopy: AppCopy = {
  formatDuration: formatDurationRussian,
  formatSessionWord: formatSessionWordRussian,
  describeMode: (mode) => {
    return mode === 'focus-only' ? 'Чистое фокус-время' : 'Полная длительность сессии';
  },
  describePhase: (kind, status) => {
    if (status === 'completed') {
      return 'План на сегодня закрыт';
    }

    return kind === 'break' ? 'Мягкий перерыв' : 'Глубокая работа';
  },
  describePhaseDetail: (kind, minutes) => {
    if (!minutes) {
      return 'Можно настроить следующий день и запустить новый цикл, когда будешь готов.';
    }

    if (kind === 'break') {
      return `Сейчас идёт восстановление на ${minutes} минут с мягким переходом и спокойным сигналом.`;
    }

    return `Сейчас идёт фокус-блок на ${minutes} минут с аккуратным звуковым маркером на границе фаз.`;
  },
  describeThemeSelection: (themeMode, resolvedTheme) => {
    if (themeMode === 'system') {
      return resolvedTheme === 'dark' ? 'Система · тёмная' : 'Система · светлая';
    }

    return themeMode === 'dark' ? 'Тёмная тема' : 'Светлая тема';
  },
  blockSequence,
  sessionState: (tone) => {
    switch (tone) {
      case 'done':
        return 'Завершена';
      case 'active':
        return 'Сейчас';
      default:
        return 'В очереди';
    }
  },
  sessionLabel: (index) => `Сессия ${index + 1}`,
  sessionFocusTitle: (session) => `${formatDurationRussian(session.focusMinutes)} фокуса`,
  sessionDetail: (session) =>
    `${formatDurationRussian(session.elapsedMinutes)} с паузами • ${session.blocks.length} фаз`,
  currentSessionProgress: (currentIndex, total, status) => {
    if (status === 'completed') {
      return 'Все сессии завершены';
    }

    return `Сессия ${currentIndex} из ${total}`;
  },
  dayProgressSummary: (sessionCount, totalMinutes) =>
    `${sessionCount} ${formatSessionWordRussian(sessionCount)} • ${formatDurationRussian(totalMinutes)} общего ритма`,
  scenarioHeading: (sessionCount, sessionHours) =>
    `${sessionCount} ${formatSessionWordRussian(sessionCount)} по ${formatDurationRussian(
      Math.round(sessionHours * 60),
    )}`,
  presetDescription: (focusMinutes, breakMinutes) =>
    `${focusMinutes} мин фокус • ${breakMinutes} мин пауза`,
  platform: (platformId) => {
    if (platformId === 'darwin') return 'macOS';
    if (platformId === 'win32') return 'Windows';
    if (platformId === 'linux') return 'Linux';
    return 'Desktop';
  },
  brandCopy: (presetLabel) =>
    `Тихий, современный desktop-ритм для глубоких сессий ${presetLabel}`,
  buttons: {
    settings: 'Настройки',
    close: 'Закрыть',
    start: 'Старт',
    pause: 'Пауза',
    resume: 'Продолжить',
    newDay: 'Новый день',
    skipPhase: 'Пропустить фазу',
    reset: 'Сбросить',
  },
  progress: {
    currentSession: 'Текущая сессия',
    dailyPlan: 'Сегодняшний план',
    allSessionsCompleted: 'Все сессии завершены',
  },
  planner: {
    kicker: 'Планировщик дня',
    title: 'Собери нужный ритм без лишнего шума',
    sessionsToday: 'Сессий сегодня',
    hoursInSession: 'Часов в сессии',
    pureFocus: 'Чистый фокус',
    includingBreaks: 'С учётом пауз',
    perSession: 'На одну сессию',
    totalToday: 'Всего сегодня',
    accounting: 'Учёт',
    accordingToPreset: 'По текущему пресету',
    withBreaksAndTransitions: 'С паузами и переходами',
    countingMode: 'Режим подсчёта',
  },
  scenario: {
    kicker: 'Сценарий дня',
  },
  settings: {
    kicker: 'Атмосфера и звук',
    title: 'Тонкая настройка приложения',
    languageTitle: 'Язык интерфейса',
    languageCurrent: 'Сейчас активно',
    themeTitle: 'Тема интерфейса',
    themeCurrent: 'Сейчас активно',
    volumeTitle: 'Громкость сигналов',
    volumeLevel: (volume) => `${Math.round(volume * 100)}% мягкости сигнала`,
    soundTitle: 'Тембр уведомлений',
    accountingTitle: 'Подсчёт длительности',
    accountingFocusOnly: {
      label: 'Чистый фокус',
      detail: 'Например, 4 часа именно чистой работы, а паузы сверху.',
    },
    accountingFullSession: {
      label: 'Полный цикл',
      detail: 'Например, все 4 часа уже включают и работу, и паузы.',
    },
  },
  languageOptions: {
    en: {
      label: 'English',
      detail: 'Базовый язык новых установок и основной язык страницы проекта на GitHub.',
    },
    ru: {
      label: 'Русский',
      detail: 'Полный интерфейс на русском для тех, кому так удобнее планировать день.',
    },
  },
  themeOptions: {
    light: {
      label: 'Light',
      detail: 'Светлая, воздушная и мягкая палитра для дневной работы.',
    },
    dark: {
      label: 'Dark',
      detail: 'Глубокий графит с тёплым акцентом и более тихим свечением.',
    },
    system: {
      label: 'System',
      detail: 'Автоматически повторяет тему операционной системы.',
    },
  },
  soundThemeOptions: {
    dawn: {
      label: 'Dawn',
      detail: 'Тёплый, чуть более живой и мягкий звон.',
    },
    glass: {
      label: 'Glass',
      detail: 'Чище, холоднее и почти кристальный оттенок.',
    },
  },
};

const COPY_BY_LANGUAGE: Record<Language, AppCopy> = {
  en: englishCopy,
  ru: russianCopy,
};

export const getCopy = (language: Language) => {
  return COPY_BY_LANGUAGE[language];
};
