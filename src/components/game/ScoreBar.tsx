import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '../ui/cn';

export interface ScoreBarProps {
  runningTotal: number;
  turn: number;
  totalTurns: number;
  penalizations: number;
}

export function ScoreBar({ runningTotal, turn, totalTurns, penalizations }: ScoreBarProps) {
  const { t } = useTranslation();
  const reducedMotion = usePrefersReducedMotion();
  const fraction = totalTurns > 0 ? Math.min(turn / totalTurns, 1) : 0;

  return (
    <div className="sticky top-0 z-20 rounded-b-xl border-b border-subtle bg-surface/95 px-4 py-3 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            {t('game.score')}
          </div>
          {reducedMotion ? (
            <span data-testid="score-value" className="text-2xl font-bold tabular-nums text-default">
              {runningTotal}
            </span>
          ) : (
            <motion.span
              key={runningTotal}
              data-testid="score-value"
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="inline-block text-2xl font-bold tabular-nums text-default"
            >
              {runningTotal}
            </motion.span>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            {t('game.turn')}
          </div>
          <span className="text-lg font-semibold tabular-nums text-default">
            {turn} / {totalTurns}
          </span>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            {t('game.penalizations')}
          </div>
          <span
            data-testid="penalizations-value"
            className="text-lg font-semibold tabular-nums text-red-600"
          >
            {penalizations}
          </span>
        </div>
      </div>
      <div
        role="progressbar"
        aria-label={t('game.progress')}
        aria-valuemin={0}
        aria-valuemax={totalTurns}
        aria-valuenow={turn}
        className="mx-auto mt-3 h-1.5 max-w-3xl overflow-hidden rounded-full bg-subtle"
      >
        <div
          data-testid="progress-fill"
          className={cn(
            'h-full rounded-full bg-accent',
            !reducedMotion && 'transition-[width] duration-500 ease-out',
          )}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}
