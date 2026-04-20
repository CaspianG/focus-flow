import { describe, expect, it } from 'vitest';
import { getCopy } from './copy';

describe('copy helpers', () => {
  it('formats durations in English by default', () => {
    const copy = getCopy('en');

    expect(copy.formatDuration(90)).toBe('1h 30m');
    expect(copy.formatDuration(50)).toBe('50m');
  });

  it('formats durations and session nouns in Russian', () => {
    const copy = getCopy('ru');

    expect(copy.formatDuration(90)).toBe('1ч 30м');
    expect(copy.formatSessionWord(2)).toBe('сессии');
    expect(copy.formatSessionWord(5)).toBe('сессий');
  });

  it('localizes accounting modes and session card text', () => {
    const english = getCopy('en');
    const russian = getCopy('ru');

    expect(english.describeMode('focus-only')).toBe('Pure focus time');
    expect(russian.describeMode('full-session')).toBe('Полная длительность сессии');
    expect(english.sessionState('queued')).toBe('Queued');
    expect(russian.sessionState('active')).toBe('Сейчас');
  });
});
