import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEY, useFocusTimer } from './use-focus-timer';

describe('useFocusTimer', () => {
  beforeEach(() => {
    localStorage.clear();

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    document.documentElement.removeAttribute('data-theme');
  });

  it('restores planner preferences from localStorage', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        preferences: {
          language: 'ru',
          presetId: '90-15',
          sessionCount: 2,
          sessionHours: 4,
          accountingMode: 'full-session',
          volume: 0.3,
          soundTheme: 'glass',
          themeMode: 'dark',
        },
      }),
    );

    const { result } = renderHook(() => useFocusTimer());

    expect(result.current.preferences.language).toBe('ru');
    expect(result.current.preferences.presetId).toBe('90-15');
    expect(result.current.preferences.sessionCount).toBe(2);
    expect(result.current.preferences.sessionHours).toBe(4);
    expect(result.current.preferences.themeMode).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(result.current.plan.settings.accountingMode).toBe('full-session');
    expect(document.documentElement.lang).toBe('ru');
  });

  it('updates the plan and persists planner changes', () => {
    const { result } = renderHook(() => useFocusTimer());

    act(() => {
      result.current.setSessionCount(3);
      result.current.setSessionHours(2.5);
      result.current.setAccountingMode('full-session');
    });

    expect(result.current.plan.settings.sessionCount).toBe(3);
    expect(result.current.plan.settings.sessionHours).toBe(2.5);
    expect(result.current.plan.settings.accountingMode).toBe('full-session');

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored.preferences.sessionCount).toBe(3);
    expect(stored.preferences.sessionHours).toBe(2.5);
    expect(stored.preferences.accountingMode).toBe('full-session');
  });

  it('resolves system theme from matchMedia and persists explicit theme changes', () => {
    const { result } = renderHook(() => useFocusTimer());

    expect(result.current.preferences.language).toBe('en');
    expect(result.current.preferences.themeMode).toBe('system');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.lang).toBe('en');

    act(() => {
      result.current.setLanguage('ru');
      result.current.setThemeMode('light');
    });

    expect(result.current.preferences.language).toBe('ru');
    expect(result.current.preferences.themeMode).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.lang).toBe('ru');

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored.preferences.language).toBe('ru');
    expect(stored.preferences.themeMode).toBe('light');
  });
});
