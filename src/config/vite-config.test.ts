// @vitest-environment node

import packageJson from '../../package.json';
import { describe, expect, it } from 'vitest';
import viteConfig from '../../vite.config';

describe('vite config for Electron packaging', () => {
  it('uses relative asset paths so the packaged app can load renderer files', () => {
    expect(viteConfig.base).toBe('./');
  });

  it('keeps the electron runtime external when bundling the main process', () => {
    expect(packageJson.scripts['dev:main']).toContain('--external electron');
    expect(packageJson.scripts['build:electron']).toContain('--external electron');
  });
});
