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
  RHYTHM_PRESETS,
  useFocusTimer,
  type PresetId,
  type ResolvedTheme,
  type ThemeMode,
} from './hooks/use-focus-timer';
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

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}ч ${remainingMinutes}м`;
  }

  if (hours > 0) {
    return `${hours}ч`;
  }

  return `${remainingMinutes}м`;
};

const formatSessionWord = (count: number) => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return 'сессия';
  }

  if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
    return 'сессии';
  }

  return 'сессий';
};

const describeMode = (mode: 'focus-only' | 'full-session') => {
  return mode === 'focus-only' ? 'Чистое фокус-время' : 'Полная длительность сессии';
};

const describePhase = (kind: SessionBlock['kind'] | undefined, status: string) => {
  if (status === 'completed') {
    return 'План на сегодня закрыт';
  }

  return kind === 'break' ? 'Мягкий перерыв' : 'Глубокая работа';
};

const describePhaseDetail = (
  kind: SessionBlock['kind'] | undefined,
  minutes: number | undefined,
) => {
  if (!minutes) {
    return 'Можно настроить следующий день и запустить новый цикл.';
  }

  if (kind === 'break') {
    return `Сейчас идёт восстановление на ${minutes} минут с мягким переходом и спокойным сигналом.`;
  }

  return `Сейчас идёт фокус-блок на ${minutes} минут с аккуратным звуковым маркером на границе фаз.`;
};

const blockSequence = (blocks: SessionBlock[]) => {
  return blocks.map((block) => block.minutes).join(' · ');
};

const describeThemeSelection = (themeMode: ThemeMode, resolvedTheme: ResolvedTheme) => {
  if (themeMode === 'system') {
    return resolvedTheme === 'dark' ? 'Система · тёмная' : 'Система · светлая';
  }

  return themeMode === 'dark' ? 'Тёмная тема' : 'Светлая тема';
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
        <span className="session-card__index">Сессия {index + 1}</span>
        <span className="session-card__state">
          {tone === 'done' ? 'Завершена' : tone === 'active' ? 'Сейчас' : 'В очереди'}
        </span>
      </div>
      <strong className="session-card__title">
        {formatDuration(session.focusMinutes)} фокуса
      </strong>
      <p className="session-card__detail">
        {formatDuration(session.elapsedMinutes)} с паузами • {session.blocks.length} фаз
      </p>
      <p className="session-card__blocks">{blockSequence(session.blocks)}</p>
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

const themeOptions: Array<{
  mode: ThemeMode;
  icon: LucideIcon;
  label: string;
  detail: string;
}> = [
  {
    mode: 'light',
    icon: SunMedium,
    label: 'Light',
    detail: 'Светлая, воздушная и мягкая палитра для дневной работы.',
  },
  {
    mode: 'dark',
    icon: MoonStar,
    label: 'Dark',
    detail: 'Глубокий графит с тёплым акцентом и более тихим свечением.',
  },
  {
    mode: 'system',
    icon: Monitor,
    label: 'System',
    detail: 'Автоматически повторяет тему операционной системы.',
  },
];

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

  const activePlan = timerState.status === 'running' ? plan : previewPlan;
  const plannerLocked = timerState.status === 'running';
  const phaseTitle = describePhase(currentBlock?.kind, timerState.status);
  const phaseDetail = describePhaseDetail(currentBlock?.kind, currentBlock?.minutes);
  const platform =
    window.focusFlowDesktop?.platform === 'darwin'
      ? 'macOS'
      : window.focusFlowDesktop?.platform === 'win32'
        ? 'Windows'
        : window.focusFlowDesktop?.platform === 'linux'
          ? 'Linux'
          : 'Desktop';
  const primaryActionLabel =
    timerState.status === 'completed'
      ? 'Новый день'
      : timerState.status === 'running'
        ? 'Пауза'
        : timerState.status === 'paused'
          ? 'Продолжить'
          : 'Старт';

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
          <p className="brand-copy">
            Тихий, современный desktop-ритм для глубоких сессий{' '}
            {RHYTHM_PRESETS[preferences.presetId].label}
          </p>
        </div>

        <button className="icon-button" onClick={() => setSettingsOpen(true)} type="button">
          <Settings2 size={18} strokeWidth={1.9} />
          <span>Настройки</span>
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
            <span className="hero-chip">{describeMode(preferences.accountingMode)}</span>
            <span className="hero-chip hero-chip--theme">
              {describeThemeSelection(preferences.themeMode, resolvedTheme)}
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
                <span>Текущая сессия</span>
                <strong>{Math.round(sessionProgress * 100)}%</strong>
              </div>
              <div className="progress-bar">
                <span
                  className="progress-fill"
                  style={{ width: `${Math.max(sessionProgress * 100, 4)}%` }}
                />
              </div>
              <p>
                {timerState.status === 'completed'
                  ? 'Все сессии завершены'
                  : `Сессия ${Math.min(timerState.sessionIndex + 1, activePlan.sessions.length)} из ${activePlan.sessions.length}`}
              </p>
            </div>

            <div className="progress-card">
              <div className="progress-card__topline">
                <span>Сегодняшний план</span>
                <strong>{Math.round(dayProgress * 100)}%</strong>
              </div>
              <div className="progress-bar">
                <span
                  className="progress-fill progress-fill--soft"
                  style={{ width: `${Math.max(dayProgress * 100, 4)}%` }}
                />
              </div>
              <p>
                {activePlan.settings.sessionCount}{' '}
                {formatSessionWord(activePlan.settings.sessionCount)} •{' '}
                {formatDuration(activePlan.totals.elapsedMinutes)} общего ритма
              </p>
            </div>
          </div>

          <div className="preset-toggle-row">
            {(Object.keys(RHYTHM_PRESETS) as PresetId[]).map((presetId) => (
              <button
                key={presetId}
                className={`preset-toggle${preferences.presetId === presetId ? ' preset-toggle--active' : ''}`}
                disabled={plannerLocked}
                onClick={() => setPresetId(presetId)}
                type="button"
              >
                <span>{RHYTHM_PRESETS[presetId].label}</span>
                <small>
                  {RHYTHM_PRESETS[presetId].focusMinutes} мин фокус •{' '}
                  {RHYTHM_PRESETS[presetId].breakMinutes} мин пауза
                </small>
              </button>
            ))}
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
              label="Пропустить фазу"
              onClick={skipPhase}
            />
            <ControlButton
              icon={RotateCcw}
              label="Сбросить"
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
                <span className="section-kicker">Планировщик дня</span>
                <h2>Собери нужный ритм без лишнего шума</h2>
              </div>
              <Sparkles size={18} strokeWidth={1.9} />
            </div>

            <div className="field-grid">
              <label className="field-card">
                <span>Сессий сегодня</span>
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
                <span>Часов в сессии</span>
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
                Чистый фокус
              </button>
              <button
                className={`mode-toggle${preferences.accountingMode === 'full-session' ? ' mode-toggle--active' : ''}`}
                disabled={plannerLocked}
                onClick={() => setAccountingMode('full-session')}
                type="button"
              >
                С учётом пауз
              </button>
            </div>

            <div className="metrics-grid">
              <MetricCard
                detail="По текущему пресету"
                label="На одну сессию"
                value={formatDuration(
                  currentSession?.focusMinutes ?? activePlan.sessions[0]?.focusMinutes ?? 0,
                )}
              />
              <MetricCard
                detail="С паузами и переходами"
                label="Всего сегодня"
                value={formatDuration(activePlan.totals.elapsedMinutes)}
              />
              <MetricCard
                detail="Режим подсчёта"
                label="Учёт"
                value={describeMode(preferences.accountingMode)}
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
                <span className="section-kicker">Сценарий дня</span>
                <h2>
                  {activePlan.settings.sessionCount}{' '}
                  {formatSessionWord(activePlan.settings.sessionCount)} по{' '}
                  {formatDuration(Math.round(activePlan.settings.sessionHours * 60))}
                </h2>
              </div>
              <Gauge size={18} strokeWidth={1.9} />
            </div>

            <div className="session-list">
              {activePlan.sessions.map((session, index) => (
                <SessionCard
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
                  <span className="section-kicker">Атмосфера и звук</span>
                  <h2>Тонкая настройка приложения</h2>
                </div>
                <button
                  className="icon-button icon-button--compact"
                  onClick={() => setSettingsOpen(false)}
                  type="button"
                >
                  Закрыть
                </button>
              </div>

              <section className="settings-group">
                <div className="settings-group__topline">
                  <MoonStar size={18} strokeWidth={1.8} />
                  <strong>Тема интерфейса</strong>
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
                <p>Сейчас активно: {describeThemeSelection(preferences.themeMode, resolvedTheme)}</p>
              </section>

              <section className="settings-group">
                <div className="settings-group__topline">
                  <Volume2 size={18} strokeWidth={1.8} />
                  <strong>Громкость сигналов</strong>
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
                <p>{Math.round(preferences.volume * 100)}% мягкости сигнала</p>
              </section>

              <section className="settings-group">
                <div className="settings-group__topline">
                  <Sparkles size={18} strokeWidth={1.8} />
                  <strong>Тембр уведомлений</strong>
                </div>
                <div className="settings-choice-grid">
                  {([
                    ['dawn', 'Dawn', 'Тёплый, чуть более живой и мягкий звон.'],
                    ['glass', 'Glass', 'Чище, холоднее и почти кристальный оттенок.'],
                  ] as [SoundTheme, string, string][]).map(([theme, label, detail]) => (
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
                  <strong>Подсчёт длительности</strong>
                </div>
                <div className="settings-choice-grid">
                  <SettingsChoice
                    active={preferences.accountingMode === 'focus-only'}
                    detail="Например, 4 часа именно чистой работы, а паузы сверху."
                    label="Чистый фокус"
                    onClick={() => setAccountingMode('focus-only')}
                  />
                  <SettingsChoice
                    active={preferences.accountingMode === 'full-session'}
                    detail="Например, все 4 часа уже включают и работу, и паузы."
                    label="Полный цикл"
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
