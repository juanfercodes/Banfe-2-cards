import { useTranslation } from 'react-i18next';

import { cn } from '../ui/cn';

export interface ScoreBarProps {
  timeRemainingMs: number;
  turn: number;
  totalTurns: number;
  penalizations: number;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function ScoreBar({ timeRemainingMs, turn, totalTurns, penalizations }: ScoreBarProps) {
  const { t } = useTranslation();
  const fraction = totalTurns > 0 ? Math.min(turn / totalTurns, 1) : 0;
  const time = formatTime(timeRemainingMs);

  return (
    <div className="sticky top-0 z-20 rounded-b-xl border-b border-subtle bg-surface/95 px-4 py-3 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-8 gap-y-2">
        <div aria-live="polite" aria-atomic="true">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {t('game.timeRemaining')}
          </div>
          <span
            data-testid="timer-value"
            className="text-3xl font-black tabular-nums text-default"
          >
            {time}
          </span>
          <span className="sr-only" data-testid="timer-aria">
            {t('game.timeRemainingAria', { time })}
          </span>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {t('game.turn')}
          </div>
          <span className="text-lg font-semibold tabular-nums text-default" data-testid="turn-count">
            {turn} / {totalTurns}
          </span>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {t('game.penalizations')}
          </div>
          <span className="inline-flex items-center gap-1.5 text-lg font-semibold tabular-nums text-red-400">
            {penalizations > 0 && (
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span data-testid="penalizations-value">{penalizations}</span>
          </span>
        </div>
      </div>
      <div
        role="progressbar"
        aria-label={t('game.progress')}
        aria-valuemin={0}
        aria-valuemax={totalTurns}
        aria-valuenow={turn}
        className="mx-auto mt-3 h-2 max-w-4xl overflow-hidden rounded-full bg-subtle/70"
      >
        <div
          data-testid="progress-fill"
          className={cn(
            'h-full rounded-full bg-gradient-to-r from-accent to-accent/60 transition-[width] duration-500 ease-out',
          )}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}
