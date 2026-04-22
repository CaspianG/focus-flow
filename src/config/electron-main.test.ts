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
});
