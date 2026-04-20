import { describe, expect, it } from 'vitest';
import { createDailyPlan } from './session-plan';

describe('createDailyPlan', () => {
  it('builds a focus-only schedule with a partial final focus block', () => {
    const plan = createDailyPlan({
      focusMinutes: 50,
      breakMinutes: 10,
      sessionCount: 2,
      sessionHours: 4,
      accountingMode: 'focus-only',
    });

    expect(plan.sessions).toHaveLength(2);
    expect(plan.sessions[0].blocks.map((block) => `${block.kind}:${block.minutes}`)).toEqual([
      'focus:50',
      'break:10',
      'focus:50',
      'break:10',
      'focus:50',
      'break:10',
      'focus:50',
      'break:10',
      'focus:40',
    ]);
    expect(plan.sessions[0].focusMinutes).toBe(240);
    expect(plan.sessions[0].elapsedMinutes).toBe(280);
    expect(plan.totals.focusMinutes).toBe(480);
    expect(plan.totals.elapsedMinutes).toBe(560);
  });

  it('builds a full-session schedule that can end with a partial final focus block', () => {
    const plan = createDailyPlan({
      focusMinutes: 90,
      breakMinutes: 15,
      sessionCount: 1,
      sessionHours: 4,
      accountingMode: 'full-session',
    });

    expect(plan.sessions[0].blocks.map((block) => `${block.kind}:${block.minutes}`)).toEqual([
      'focus:90',
      'break:15',
      'focus:90',
      'break:15',
      'focus:30',
    ]);
    expect(plan.sessions[0].focusMinutes).toBe(210);
    expect(plan.sessions[0].elapsedMinutes).toBe(240);
  });

  it('clamps invalid planner inputs to safe values', () => {
    const plan = createDailyPlan({
      focusMinutes: 1,
      breakMinutes: 0,
      sessionCount: 0,
      sessionHours: 0.1,
      accountingMode: 'focus-only',
    });

    expect(plan.settings.focusMinutes).toBe(15);
    expect(plan.settings.breakMinutes).toBe(5);
    expect(plan.settings.sessionCount).toBe(1);
    expect(plan.settings.sessionHours).toBe(0.5);
  });
});
