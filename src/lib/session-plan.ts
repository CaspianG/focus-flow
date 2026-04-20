export type AccountingMode = 'focus-only' | 'full-session';
export type BlockKind = 'focus' | 'break';

export type PlannerInput = {
  focusMinutes: number;
  breakMinutes: number;
  sessionCount: number;
  sessionHours: number;
  accountingMode: AccountingMode;
};

export type PlannerSettings = PlannerInput;

export type SessionBlock = {
  id: string;
  kind: BlockKind;
  minutes: number;
  cumulativeFocusMinutes: number;
  cumulativeElapsedMinutes: number;
};

export type PlannedSession = {
  sessionIndex: number;
  blocks: SessionBlock[];
  focusMinutes: number;
  breakMinutes: number;
  elapsedMinutes: number;
};

export type DailyPlan = {
  settings: PlannerSettings;
  sessions: PlannedSession[];
  totals: {
    focusMinutes: number;
    breakMinutes: number;
    elapsedMinutes: number;
  };
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const sanitizeSettings = (input: PlannerInput): PlannerSettings => {
  const safeFocusMinutes = clamp(Math.round(input.focusMinutes), 15, 180);
  const safeBreakMinutes = clamp(Math.round(input.breakMinutes), 5, 60);
  const safeSessionCount = clamp(Math.round(input.sessionCount), 1, 12);
  const safeSessionHours = Math.round(clamp(input.sessionHours, 0.5, 12) * 4) / 4;

  return {
    focusMinutes: safeFocusMinutes,
    breakMinutes: safeBreakMinutes,
    sessionCount: safeSessionCount,
    sessionHours: safeSessionHours,
    accountingMode: input.accountingMode,
  };
};

const pushBlock = (
  blocks: SessionBlock[],
  kind: BlockKind,
  minutes: number,
  sessionIndex: number,
) => {
  const previous = blocks.at(-1);
  const cumulativeFocusMinutes =
    (previous?.cumulativeFocusMinutes ?? 0) + (kind === 'focus' ? minutes : 0);
  const cumulativeElapsedMinutes = (previous?.cumulativeElapsedMinutes ?? 0) + minutes;

  blocks.push({
    id: `session-${sessionIndex}-${blocks.length}-${kind}`,
    kind,
    minutes,
    cumulativeFocusMinutes,
    cumulativeElapsedMinutes,
  });
};

const buildFocusOnlySession = (
  settings: PlannerSettings,
  sessionIndex: number,
  targetFocusMinutes: number,
) => {
  const blocks: SessionBlock[] = [];
  let remainingFocusMinutes = targetFocusMinutes;

  while (remainingFocusMinutes > 0) {
    const nextFocusMinutes = Math.min(settings.focusMinutes, remainingFocusMinutes);
    pushBlock(blocks, 'focus', nextFocusMinutes, sessionIndex);
    remainingFocusMinutes -= nextFocusMinutes;

    if (remainingFocusMinutes > 0) {
      pushBlock(blocks, 'break', settings.breakMinutes, sessionIndex);
    }
  }

  return blocks;
};

const buildFullSession = (
  settings: PlannerSettings,
  sessionIndex: number,
  targetElapsedMinutes: number,
) => {
  const blocks: SessionBlock[] = [];
  let remainingElapsedMinutes = targetElapsedMinutes;
  let nextKind: BlockKind = 'focus';

  while (remainingElapsedMinutes > 0) {
    const blockDuration = nextKind === 'focus' ? settings.focusMinutes : settings.breakMinutes;
    const nextMinutes = Math.min(blockDuration, remainingElapsedMinutes);
    pushBlock(blocks, nextKind, nextMinutes, sessionIndex);
    remainingElapsedMinutes -= nextMinutes;
    nextKind = nextKind === 'focus' ? 'break' : 'focus';
  }

  return blocks;
};

const summarizeSession = (blocks: SessionBlock[], sessionIndex: number): PlannedSession => {
  const focusMinutes = blocks
    .filter((block) => block.kind === 'focus')
    .reduce((total, block) => total + block.minutes, 0);
  const breakMinutes = blocks
    .filter((block) => block.kind === 'break')
    .reduce((total, block) => total + block.minutes, 0);

  return {
    sessionIndex,
    blocks,
    focusMinutes,
    breakMinutes,
    elapsedMinutes: focusMinutes + breakMinutes,
  };
};

export const createDailyPlan = (input: PlannerInput): DailyPlan => {
  const settings = sanitizeSettings(input);
  const targetMinutes = Math.round(settings.sessionHours * 60);
  const sessions = Array.from({ length: settings.sessionCount }, (_, sessionIndex) => {
    const blocks =
      settings.accountingMode === 'focus-only'
        ? buildFocusOnlySession(settings, sessionIndex, targetMinutes)
        : buildFullSession(settings, sessionIndex, targetMinutes);

    return summarizeSession(blocks, sessionIndex);
  });

  const totals = sessions.reduce(
    (accumulator, session) => {
      accumulator.focusMinutes += session.focusMinutes;
      accumulator.breakMinutes += session.breakMinutes;
      accumulator.elapsedMinutes += session.elapsedMinutes;
      return accumulator;
    },
    {
      focusMinutes: 0,
      breakMinutes: 0,
      elapsedMinutes: 0,
    },
  );

  return {
    settings,
    sessions,
    totals,
  };
};
