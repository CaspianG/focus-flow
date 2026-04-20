import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { STORAGE_KEY } from './hooks/use-focus-timer';

describe('App localization', () => {
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

    window.focusFlowDesktop = {
      platform: 'win32',
    };
  });

  it('defaults to English and persists a manual switch to Russian', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByText(/shape the rhythm you need without the noise/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    fireEvent.click(screen.getByRole('button', { name: /russian/i }));

    expect(screen.getByRole('button', { name: /настройки/i })).toBeInTheDocument();
    expect(screen.getByText(/собери нужный ритм без лишнего шума/i)).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored.preferences.language).toBe('ru');
  });
});
