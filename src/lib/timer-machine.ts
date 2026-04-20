import type { DailyPlan, SessionBlock } from './session-plan';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';
export type TimerEventType =
  | 'focus-started'
  | 'break-started'
  | 'session-complete'
  | 'day-complete';

export type TimerEvent = {
  type: TimerEventType;
  sessionIndex: number;
};

export type TimerState = {
  plan: DailyPlan;
  status: TimerStatus;
  sessionIndex: number;
  blockIndex: number;
  remainingMs: number;
  startedAt: number | null;
  endsAt: number | null;
};

export type TimerResult = {
  state: TimerState;
  events: TimerEvent[];
};

const MINUTE_IN_MS = 60_000;

const getBlockDurationMs = (block: SessionBlock | undefined) => {
  return (block?.minutes ?? 0) * MINUTE_IN_MS;
};

export const getCurrentBlock = (state: TimerState) => {
  return state.plan.sessions[state.sessionIndex]?.blocks[state.blockIndex];
};

const withNextBlockRunning = (
  state: TimerState,
  blockIndex: number,
  now: number,
): TimerResult => {
  const nextBlock = state.plan.sessions[state.sessionIndex]?.blocks[blockIndex];
  const remainingMs = getBlockDurationMs(nextBlock);

  return {
    state: {
      ...state,
      status: 'running',
      blockIndex,
      remainingMs,
      startedAt: now,
      endsAt: now + remainingMs,
    },
    events: nextBlock
      ? [
          {
            type: nextBlock.kind === 'focus' ? 'focus-started' : 'break-started',
            sessionIndex: state.sessionIndex,
          },
        ]
      : [],
  };
};

export const createTimerState = (plan: DailyPlan): TimerState => {
  const firstBlock = plan.sessions[0]?.blocks[0];

  return {
    plan,
    status: firstBlock ? 'idle' : 'completed',
    sessionIndex: 0,
    blockIndex: 0,
    remainingMs: getBlockDurationMs(firstBlock),
    startedAt: null,
    endsAt: null,
  };
};

export const resumeTimer = (state: TimerState, now: number): TimerResult => {
  if (state.status === 'running' || state.status === 'completed') {
    return { state, events: [] };
  }

  return {
    state: {
      ...state,
      status: 'running',
      startedAt: now,
      endsAt: now + state.remainingMs,
    },
    events: [],
  };
};

export const pauseTimer = (state: TimerState, now: number): TimerResult => {
  if (state.status !== 'running' || state.endsAt === null) {
    return { state, events: [] };
  }

  return {
    state: {
      ...state,
      status: 'paused',
      remainingMs: Math.max(0, state.endsAt - now),
      startedAt: null,
      endsAt: null,
    },
    events: [],
  };
};

const finishCurrentBlock = (state: TimerState, now: number): TimerResult => {
  const currentSession = state.plan.sessions[state.sessionIndex];
  const nextBlockIndex = state.blockIndex + 1;
  const nextSessionIndex = state.sessionIndex + 1;

  if (currentSession?.blocks[nextBlockIndex]) {
    return withNextBlockRunning(state, nextBlockIndex, now);
  }

  if (state.plan.sessions[nextSessionIndex]?.blocks[0]) {
    return {
      state: {
        ...state,
        status: 'idle',
        sessionIndex: nextSessionIndex,
        blockIndex: 0,
        remainingMs: getBlockDurationMs(state.plan.sessions[nextSessionIndex].blocks[0]),
        startedAt: null,
        endsAt: null,
      },
      events: [{ type: 'session-complete', sessionIndex: state.sessionIndex }],
    };
  }

  return {
    state: {
      ...state,
      status: 'completed',
      remainingMs: 0,
      startedAt: null,
      endsAt: null,
    },
    events: [{ type: 'day-complete', sessionIndex: state.sessionIndex }],
  };
};

export const advanceTimer = (state: TimerState, now: number): TimerResult => {
  if (state.status !== 'running' || state.endsAt === null) {
    return { state, events: [] };
  }

  let workingState = state;
  const events: TimerEvent[] = [];

  while (workingState.status === 'running' && workingState.endsAt !== null && now >= workingState.endsAt) {
    const transitionMoment = workingState.endsAt;
    const transition = finishCurrentBlock(workingState, transitionMoment);
    workingState = transition.state;
    events.push(...transition.events);
  }

  if (workingState.status === 'running' && workingState.endsAt !== null) {
    workingState = {
      ...workingState,
      remainingMs: Math.max(0, workingState.endsAt - now),
    };
  }

  return {
    state: workingState,
    events,
  };
};

export const skipPhase = (state: TimerState, now: number): TimerResult => {
  if (state.status === 'completed') {
    return { state, events: [] };
  }

  return finishCurrentBlock(state, now);
};

export const resetDay = (state: TimerState): TimerResult => {
  return {
    state: createTimerState(state.plan),
    events: [],
  };
};
