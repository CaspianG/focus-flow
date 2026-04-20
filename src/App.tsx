import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Gauge,
  Monitor,
  MoonStar,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  SkipForward,
  Sparkles,
  SunMedium,
  Volume2,
} from 'lucide-react';
import { useState } from 'react';
import {
  getCopy,
  type AppCopy,
  type Language,
  type PlatformId,
  type ResolvedTheme,
  type ThemeMode,
} from './lib/copy';
import { RHYTHM_PRESETS, useFocusTimer, type PresetId } from './hooks/use-focus-timer';
import type { PlannedSession, SessionBlock } from './lib/session-plan';
import type { SoundTheme } from './lib/sound';

type ControlButtonProps = {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
};

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
};

type SessionCardProps = {
  copy: AppCopy;
  session: PlannedSession;
  index: number;
  currentSessionIndex: number;
  dayComplete: boolean;
};

type SettingsChoiceProps = {
  active: boolean;
  icon?: LucideIcon;
  label: string;
  detail: string;
  onClick: () => void;
};

const ControlButton = ({
  icon: Icon,
  label,
  onClick,
  tone = 'secondary',
  disabled,
}: ControlButtonProps) => {
  return (
    <button
      className={`control-button control-button--${tone}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon size={18} strokeWidth={1.85} />
      <span>{label}</span>
    </button>
  );
};

const MetricCard = ({ label, value, detail }: MetricCardProps) => {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-detail">{detail}</span>
    </div>
  );
};

const SessionCard = ({
  copy,
  session,
  index,
  currentSessionIndex,
  dayComplete,
}: SessionCardProps) => {
  const tone =
    dayComplete || index < currentSessionIndex
      ? 'done'
      : index === currentSessionIndex
        ? 'active'
        : 'queued';

  return (
    <article className={`session-card session-card--${tone}`}>
      <div className="session-card__topline">
        <span className="session-card__index">{copy.sessionLabel(index)}</span>
        <span className="session-card__state">{copy.sessionState(tone)}</span>
      </div>
      <strong className="session-card__title">{copy.sessionFocusTitle(session)}</strong>
      <p className="session-card__detail">{copy.sessionDetail(session)}</p>
      <p className="session-card__blocks">{copy.blockSequence(session.blocks)}</p>
    </article>
  );
};

const SettingsChoice = ({
  active,
  icon: Icon,
  label,
  detail,
  onClick,
}: SettingsChoiceProps) => {
  return (
    <button
      className={`settings-choice${active ? ' settings-choice--active' : ''}`}
      onClick={onClick}
      type="button"
    >
      <div className="settings-choice__header">
        {Icon ? <Icon size={16} strokeWidth={1.9} /> : null}
        <span className="settings-choice__label">{label}</span>
      </div>
      <span className="settings-choice__detail">{detail}</span>
    </button>
  );
};

const App = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
    preferences,
    plan,
    previewPlan,
    timerState,
    currentBlock,
    currentSession,
    displayTime,
    dayProgress,
    sessionProgress,
    resolvedTheme,
    setPresetId,
    setLanguage,
    setSessionCount,
    setSessionHours,
    setAccountingMode,
    setVolume,
    setSoundTheme,
    setThemeMode,
    toggleRunning,
    skipPhase,
    resetPlanner,
  } = useFocusTimer();

  const copy = getCopy(preferences.language);
  const activePlan = timerState.status === 'running' ? plan : previewPlan;
  const plannerLocked = timerState.status === 'running';
  const phaseTitle = copy.describePhase(currentBlock?.kind, timerState.status);
  const phaseDetail = copy.describePhaseDetail(currentBlock?.kind, currentBlock?.minutes);
  const platform = copy.platform(window.focusFlowDesktop?.platform as PlatformId);
  const primaryActionLabel =
    timerState.status === 'completed'
      ? copy.buttons.newDay
      : timerState.status === 'running'
        ? copy.buttons.pause
        : timerState.status === 'paused'
          ? copy.buttons.resume
          : copy.buttons.start;

  const themeOptions: Array<{
    mode: ThemeMode;
    icon: LucideIcon;
    label: string;
    detail: string;
  }> = [
    {
      mode: 'light',
      icon: SunMedium,
      label: copy.themeOptions.light.label,
      detail: copy.themeOptions.light.detail,
    },
    {
      mode: 'dark',
      icon: MoonStar,
      label: copy.themeOptions.dark.label,
      detail: copy.themeOptions.dark.detail,
    },
    {
      mode: 'system',
      icon: Monitor,
      label: copy.themeOptions.system.label,
      detail: copy.themeOptions.system.detail,
    },
  ];

  const languageOptions: Array<{
    language: Language;
    label: string;
    detail: string;
  }> = [
    {
      language: 'en',
      label: copy.languageOptions.en.label,
      detail: copy.languageOptions.en.detail,
    },
    {
      language: 'ru',
      label: copy.languageOptions.ru.label,
      detail: copy.languageOptions.ru.detail,
    },
  ];

  const soundOptions: Array<[SoundTheme, string, string]> = [
    ['dawn', copy.soundThemeOptions.dawn.label, copy.soundThemeOptions.dawn.detail],
    ['glass', copy.soundThemeOptions.glass.label, copy.soundThemeOptions.glass.detail],
  ];

  const handlePrimaryAction = () => {
    if (timerState.status === 'completed') {
      resetPlanner();
      return;
    }

    toggleRunning();
  };

  return (
    <div className="app-shell">
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />
      <div className="ambient ambient--three" />

      <motion.header
        animate={{ opacity: 1, y: 0 }}
        className="topbar"
        initial={{ opacity: 0, y: -18 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <span className="brand-mark">Focus Flow</span>
          <p className="brand-copy">{copy.brandCopy(RHYTHM_PRESETS[preferences.presetId].label)}</p>
        </div>

        <button className="icon-button" onClick={() => setSettingsOpen(true)} type="button">
          <Settings2 size={18} strokeWidth={1.9} />
          <span>{copy.buttons.settings}</span>
        </button>
      </motion.header>

      <main className="dashboard-grid">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="panel-surface hero-panel"
          initial={{ opacity: 0, y: 22 }}
          transition={{ duration: 0.65, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hero-chip-row">
            <span className="hero-chip hero-chip--accent">
              {RHYTHM_PRESETS[preferences.presetId].label}
            </span>
            <span className="hero-chip">{platform}</span>
            <span className="hero-chip">{copy.describeMode(preferences.accountingMode)}</span>
            <span className="hero-chip hero-chip--theme">
              {copy.describeThemeSelection(preferences.themeMode, resolvedTheme)}
            </span>
          </div>

          <div className="hero-heading">
            <p className="hero-kicker">{phaseTitle}</p>
            <h1 className="hero-timer">{displayTime}</h1>
            <p className="hero-description">{phaseDetail}</p>
          </div>

          <div className="progress-cluster">
            <div className="progress-card">
              <div className="progress-card__topline">
                <span>{copy.progress.currentSession}</span>
                <strong>{Math.round(sessionProgress * 100)}%</strong>
              </div>
              <div className="progress-bar">
                <span
                  className="progress-fill"
                  style={{ width: `${Math.max(sessionProgress * 100, 4)}%` }}
                />
              </div>
              <p>
                {copy.currentSessionProgress(
                  Math.min(timerState.sessionIndex + 1, activePlan.sessions.length),
                  activePlan.sessions.length,
                  timerState.status,
                )}
              </p>
            </div>

            <div className="progress-card">
              <div className="progress-card__topline">
                <span>{copy.progress.dailyPlan}</span>
                <strong>{Math.round(dayProgress * 100)}%</strong>
              </div>
              <div className="progress-bar">
                <span
                  className="progress-fill progress-fill--soft"
                  style={{ width: `${Math.max(dayProgress * 100, 4)}%` }}
                />
              </div>
              <p>
                {copy.dayProgressSummary(
                  activePlan.settings.sessionCount,
                  activePlan.totals.elapsedMinutes,
                )}
              </p>
            </div>
          </div>

          <div className="preset-toggle-row">
            {(Object.keys(RHYTHM_PRESETS) as PresetId[]).map((presetId) => {
              const preset = RHYTHM_PRESETS[presetId];

              return (
                <button
                  key={presetId}
                  className={`preset-toggle${preferences.presetId === presetId ? ' preset-toggle--active' : ''}`}
                  disabled={plannerLocked}
                  onClick={() => setPresetId(presetId)}
                  type="button"
                >
                  <span>{preset.label}</span>
                  <small>{copy.presetDescription(preset.focusMinutes, preset.breakMinutes)}</small>
                </button>
              );
            })}
          </div>

          <div className="controls-row">
            <ControlButton
              icon={timerState.status === 'running' ? Pause : Play}
              label={primaryActionLabel}
              onClick={handlePrimaryAction}
              tone="primary"
            />
            <ControlButton
              disabled={timerState.status === 'completed'}
              icon={SkipForward}
              label={copy.buttons.skipPhase}
              onClick={skipPhase}
            />
            <ControlButton
              icon={RotateCcw}
              label={copy.buttons.reset}
              onClick={resetPlanner}
              tone="ghost"
            />
          </div>
        </motion.section>

        <div className="dashboard-side">
          <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="panel-surface planner-panel"
            initial={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="panel-heading">
              <div>
                <span className="section-kicker">{copy.planner.kicker}</span>
                <h2>{copy.planner.title}</h2>
              </div>
              <Sparkles size={18} strokeWidth={1.9} />
            </div>

            <div className="field-grid">
              <label className="field-card">
                <span>{copy.planner.sessionsToday}</span>
                <input
                  disabled={plannerLocked}
                  max={12}
                  min={1}
                  onChange={(event) => setSessionCount(Number(event.target.value))}
                  type="number"
                  value={preferences.sessionCount}
                />
              </label>

              <label className="field-card">
                <span>{copy.planner.hoursInSession}</span>
                <input
                  disabled={plannerLocked}
                  max={12}
                  min={0.5}
                  onChange={(event) => setSessionHours(Number(event.target.value))}
                  step={0.25}
                  type="number"
                  value={preferences.sessionHours}
                />
              </label>
            </div>

            <div className="mode-switcher">
              <button
                className={`mode-toggle${preferences.accountingMode === 'focus-only' ? ' mode-toggle--active' : ''}`}
                disabled={plannerLocked}
                onClick={() => setAccountingMode('focus-only')}
                type="button"
              >
                {copy.planner.pureFocus}
              </button>
              <button
                className={`mode-toggle${preferences.accountingMode === 'full-session' ? ' mode-toggle--active' : ''}`}
                disabled={plannerLocked}
                onClick={() => setAccountingMode('full-session')}
                type="button"
              >
                {copy.planner.includingBreaks}
              </button>
            </div>

            <div className="metrics-grid">
              <MetricCard
                detail={copy.planner.accordingToPreset}
                label={copy.planner.perSession}
                value={copy.formatDuration(
                  currentSession?.focusMinutes ?? activePlan.sessions[0]?.focusMinutes ?? 0,
                )}
              />
              <MetricCard
                detail={copy.planner.withBreaksAndTransitions}
                label={copy.planner.totalToday}
                value={copy.formatDuration(activePlan.totals.elapsedMinutes)}
              />
              <MetricCard
                detail={copy.planner.countingMode}
                label={copy.planner.accounting}
                value={copy.describeMode(preferences.accountingMode)}
              />
            </div>
          </motion.section>

          <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="panel-surface session-list-panel"
            initial={{ opacity: 0, y: 32 }}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="panel-heading">
              <div>
                <span className="section-kicker">{copy.scenario.kicker}</span>
                <h2>
                  {copy.scenarioHeading(
                    activePlan.settings.sessionCount,
                    activePlan.settings.sessionHours,
                  )}
                </h2>
              </div>
              <Gauge size={18} strokeWidth={1.9} />
            </div>

            <div className="session-list">
              {activePlan.sessions.map((session, index) => (
                <SessionCard
                  copy={copy}
                  currentSessionIndex={timerState.sessionIndex}
                  dayComplete={timerState.status === 'completed'}
                  index={index}
                  key={session.sessionIndex}
                  session={session}
                />
              ))}
            </div>
          </motion.section>
        </div>
      </main>

      <AnimatePresence>
        {settingsOpen ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="settings-backdrop"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setSettingsOpen(false)}
          >
            <motion.aside
              animate={{ opacity: 1, x: 0 }}
              className="settings-sheet"
              exit={{ opacity: 0, x: 32 }}
              initial={{ opacity: 0, x: 56 }}
              onClick={(event) => event.stopPropagation()}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="settings-sheet__header">
                <div>
                  <span className="section-kicker">{copy.settings.kicker}</span>
                  <h2>{copy.settings.title}</h2>
                </div>
                <button
                  className="icon-button icon-button--compact"
                  onClick={() => setSettingsOpen(false)}
                  type="button"
                >
                  {copy.buttons.close}
                </button>
              </div>

              <section className="settings-group">
                <div className="settings-group__topline">
                  <Settings2 size={18} strokeWidth={1.8} />
                  <strong>{copy.settings.languageTitle}</strong>
                </div>
                <div className="settings-choice-grid settings-choice-grid--duo">
                  {languageOptions.map(({ language, label, detail }) => (
                    <SettingsChoice
                      active={preferences.language === language}
                      detail={detail}
                      key={language}
                      label={label}
                      onClick={() => setLanguage(language)}
                    />
                  ))}
                </div>
                <p>
                  {copy.settings.languageCurrent}: {copy.languageOptions[preferences.language].label}
                </p>
              </section>

              <section className="settings-group">
                <div className="settings-group__topline">
                  <MoonStar size={18} strokeWidth={1.8} />
                  <strong>{copy.settings.themeTitle}</strong>
                </div>
                <div className="settings-choice-grid settings-choice-grid--themes">
                  {themeOptions.map(({ mode, icon, label, detail }) => (
                    <SettingsChoice
                      active={preferences.themeMode === mode}
                      detail={detail}
                      icon={icon}
                      key={mode}
                      label={label}
                      onClick={() => setThemeMode(mode)}
                    />
                  ))}
                </div>
                <p>
                  {copy.settings.themeCurrent}:{' '}
                  {copy.describeThemeSelection(preferences.themeMode, resolvedTheme)}
                </p>
              </section>

              <section className="settings-group">
                <div className="settings-group__topline">
                  <Volume2 size={18} strokeWidth={1.8} />
                  <strong>{copy.settings.volumeTitle}</strong>
                </div>
                <input
                  className="volume-slider"
                  max={1}
                  min={0}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  step={0.01}
                  type="range"
                  value={preferences.volume}
                />
                <p>{copy.settings.volumeLevel(preferences.volume)}</p>
              </section>

              <section className="settings-group">
                <div className="settings-group__topline">
                  <Sparkles size={18} strokeWidth={1.8} />
                  <strong>{copy.settings.soundTitle}</strong>
                </div>
                <div className="settings-choice-grid settings-choice-grid--duo">
                  {soundOptions.map(([theme, label, detail]) => (
                    <SettingsChoice
                      active={preferences.soundTheme === theme}
                      detail={detail}
                      key={theme}
                      label={label}
                      onClick={() => setSoundTheme(theme)}
                    />
                  ))}
                </div>
              </section>

              <section className="settings-group">
                <div className="settings-group__topline">
                  <Gauge size={18} strokeWidth={1.8} />
                  <strong>{copy.settings.accountingTitle}</strong>
                </div>
                <div className="settings-choice-grid settings-choice-grid--duo">
                  <SettingsChoice
                    active={preferences.accountingMode === 'focus-only'}
                    detail={copy.settings.accountingFocusOnly.detail}
                    label={copy.settings.accountingFocusOnly.label}
                    onClick={() => setAccountingMode('focus-only')}
                  />
                  <SettingsChoice
                    active={preferences.accountingMode === 'full-session'}
                    detail={copy.settings.accountingFullSession.detail}
                    label={copy.settings.accountingFullSession.label}
                    onClick={() => setAccountingMode('full-session')}
                  />
                </div>
              </section>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default App;
