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

  it('builds installer and portable Windows artifacts automatically', () => {
    const targets = packageJson.build.win.target.map((target) =>
      typeof target === 'string' ? target : target.target,
    );

    expect(targets).toContain('nsis');
    expect(targets).toContain('zip');
  });

  it('creates stable Windows shortcuts from the installer', () => {
    expect(packageJson.build.nsis.createDesktopShortcut).toBe('always');
    expect(packageJson.build.nsis.createStartMenuShortcut).toBe(true);
    expect(packageJson.build.nsis.shortcutName).toBe('Focus Flow');
  });

  it('ships the app icon for the runtime tray menu', () => {
    expect(packageJson.build.files).toContain('build/icon.ico');
  });
});
