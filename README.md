# Focus Flow

<p align="center">
  <img src="./src/assets/hero.png" width="132" alt="Focus Flow logo" />
</p>

<p align="center">
  A premium desktop focus timer for deep work rituals, calm breaks, and beautifully structured days.
</p>

<p align="center">
  50/10 and 90/15 rhythms • session planning • gentle sound cues • Light / Dark / System themes
</p>

<p align="center">
  <a href="https://github.com/CaspianG/focus-flow/releases">Download for Windows</a>
</p>

## Preview

![Focus Flow light theme](./docs/screenshots/focus-flow-light.png)
![Focus Flow dark theme](./docs/screenshots/focus-flow-dark.png)

## Why Focus Flow

Focus Flow is a desktop timer for people who want a calm, premium workspace for structured focus. It supports classic `50 / 10` and `90 / 15` rhythms, pleasant audio transitions between phases, and day planning by sessions instead of one endless timer.

Example: if you want to work through `2 sessions × 4 hours`, the app can calculate that day either as:

- `Focus-only`: 4 hours of pure deep work, with breaks added on top.
- `Full session`: 4 hours total, including both focus blocks and breaks.

That switch lives in Settings, so the planner adapts to the way you like to count your work.

## Features

- Two deep-work presets: `50 / 10` and `90 / 15`
- Daily planning by session count and session duration
- Two accounting modes: `focus-only` and `full-session`
- Start, pause, skip, and reset controls
- Gentle built-in sound cues with two sound profiles: `Dawn` and `Glass`
- Theme modes: `Light`, `Dark`, and `System`
- Progress overview for the current block, current session, and the full day
- Persistent local state, so your plan survives app restarts
- Packaged as a desktop app with Electron

## Install

The easiest way to use Focus Flow is from the [GitHub Releases](https://github.com/CaspianG/focus-flow/releases) page.

### Windows

1. Download `Focus Flow Setup 0.1.0.exe` from the latest release.
2. Run the installer.
3. Launch `Focus Flow` from the Start menu or desktop shortcut.

If you prefer a portable build, the release can also include an unpacked executable.

## Create A Desktop Shortcut

If Windows did not create a shortcut automatically:

1. Open the installed app folder or the unpacked release folder.
2. Right-click `Focus Flow.exe`.
3. Choose `Send to` -> `Desktop (create shortcut)`.

If you are running the local build from this repository, the executable is usually located at:

`release/win-unpacked/Focus Flow.exe`

## Tech Stack

- Electron
- React 19
- TypeScript
- Vite
- Framer Motion
- Vitest

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run dist
```

This creates release artifacts in the `release/` directory.

## Project Structure

```text
electron/              Electron main and preload processes
src/App.tsx            Main desktop UI
src/hooks/             App state and timer hooks
src/lib/               Planner, timer, sound, and storage logic
src/styles.css         Visual system and theme tokens
docs/screenshots/      README images
```

## Testing

```bash
npm test
```

## Notes

- Windows is the primary verified target right now.
- macOS and Linux targets are configured in Electron Builder, but they still need real-device verification and signing before public distribution.

