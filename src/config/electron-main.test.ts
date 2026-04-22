// @vitest-environment node

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(path.join(process.cwd(), 'electron/main.ts'), 'utf8');

describe('Electron main process startup behavior', () => {
  it('prevents duplicate windows when the app shortcut is clicked repeatedly', () => {
    expect(mainSource).toContain('requestSingleInstanceLock');
    expect(mainSource).toContain('second-instance');
  });

  it('keeps the timer alive by hiding the window to tray instead of destroying it', () => {
    expect(mainSource).toContain("event.preventDefault()");
    expect(mainSource).toContain("window.hide()");
    expect(mainSource).toContain("window.on('close'");
  });

  it('provides a tray menu for reopening or fully quitting the app', () => {
    expect(mainSource).toContain('new Tray');
    expect(mainSource).toContain('Open Focus Flow');
    expect(mainSource).toContain('Quit Focus Flow');
    expect(mainSource).toContain('setContextMenu');
  });
});
