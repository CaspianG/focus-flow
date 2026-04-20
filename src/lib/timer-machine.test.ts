import { describe, expect, it } from 'vitest';
import { createDailyPlan } from './session-plan';
import { advanceTimer, createTimerState, pauseTimer, resumeTimer } from './timer-machine';

describe('timer machine', () => {
  const plan = createDailyPlan({
    focusMinutes: 50,
    breakMinutes: 10,
    sessionCount: 2,
    sessionHours: 1,
    accountingMode: 'focus-only',
  });

  it('starts from the first focus block in idle state', () => {
    const state = createTimerState(plan);

    expect(state.status).toBe('idle');
    expect(state.sessionIndex).toBe(0);
    expect(state.blockIndex).toBe(0);
    expect(state.remainingMs).toBe(50 * 60 * 1000);
  });

  it('transitions from focus to break when the block completes', () => {
    const initial = createTimerState(plan);
    const running = resumeTimer(initial, 1_000);
    const result = advanceTimer(running.state, 50 * 60 * 1000 + 1_000);

    expect(result.state.status).toBe('running');
    expect(result.state.blockIndex).toBe(1);
    expect(result.state.remainingMs).toBe(10 * 60 * 1000);
    expect(result.events).toEqual([{ type: 'break-started', sessionIndex: 0 }]);
  });

  it('preserves the correct remaining time when paused', () => {
    const initial = createTimerState(plan);
    const running = resumeTimer(initial, 10_000);
    const paused = pauseTimer(running.state, 20_000);

    expect(paused.state.status).toBe('paused');
    expect(paused.state.remainingMs).toBe(49 * 60 * 1000 + 50_000);
  });

  it('moves to the next session after the current session completes', () => {
    const oneHourPlan = createDailyPlan({
      focusMinutes: 50,
      breakMinutes: 10,
      sessionCount: 2,
      sessionHours: 1,
      accountingMode: 'full-session',
    });

    const initial = createTimerState(oneHourPlan);
    const running = resumeTimer(initial, 0);
    const result = advanceTimer(running.state, 60 * 60 * 1000);

    expect(result.state.status).toBe('idle');
    expect(result.state.sessionIndex).toBe(1);
    expect(result.state.blockIndex).toBe(0);
    expect(result.events).toEqual([
      { type: 'break-started', sessionIndex: 0 },
      { type: 'session-complete', sessionIndex: 0 },
    ]);
  });

  it('marks the whole day as complete after the final session', () => {
    const finalSessionPlan = createDailyPlan({
      focusMinutes: 90,
      breakMinutes: 15,
      sessionCount: 1,
      sessionHours: 1.5,
      accountingMode: 'focus-only',
    });

    const initial = createTimerState(finalSessionPlan);
    const running = resumeTimer(initial, 0);
    const result = advanceTimer(running.state, 90 * 60 * 1000);

    expect(result.state.status).toBe('completed');
    expect(result.state.sessionIndex).toBe(0);
    expect(result.events).toEqual([{ type: 'day-complete', sessionIndex: 0 }]);
  });
});
