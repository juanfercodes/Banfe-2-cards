import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import type { TurnEvent } from '@/lib/gameEngine';
import type { StackId } from '@/lib/protocol';
import { PlayingCard } from './PlayingCard';
import { cn } from '../ui/cn';

export interface StackProps {
  stack: StackId;
  reward: number;
  remaining: number;
  canDraw: boolean;
  onDraw: (stack: StackId) => void;
  lastEvent?: TurnEvent | null | undefined;
}

const pileCard = 'absolute inset-0 rounded-xl border border-subtle shadow-sm';
const pileBack = 'bg-gradient-to-br from-accent to-accent/70';

export function Stack({ stack, reward, remaining, canDraw, onDraw, lastEvent = null }: StackProps) {
  const { t } = useTranslation();
  const reducedMotion = usePrefersReducedMotion();

  const topCard = (
    <span
      aria-hidden="true"
      className={cn(pileCard, pileBack, 'flex items-center justify-center')}
    >
      <span className="flex h-[calc(100%-12px)] w-[calc(100%-12px)] items-center justify-center rounded-lg border-2 border-white/40 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.25)_1px,transparent_1px)] bg-[length:10px_10px]">
        <span className="text-lg font-black text-white/80">B2</span>
      </span>
    </span>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        disabled={!canDraw}
        onClick={() => onDraw(stack)}
        aria-label={t('game.stackAria', { stack, reward, remaining })}
        className={cn(
          'relative h-36 w-24 rounded-xl transition-transform focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg',
          canDraw && !reducedMotion && 'hover:-translate-y-1',
          !canDraw && 'cursor-not-allowed opacity-60',
        )}
      >
        {remaining > 2 && (
          <span aria-hidden="true" className={cn(pileCard, pileBack, 'left-1.5 top-1.5 opacity-60')} />
        )}
        {remaining > 1 && (
          <span aria-hidden="true" className={cn(pileCard, pileBack, 'left-0.5 top-0.5 opacity-80')} />
        )}
        {remaining > 0 ? (
          reducedMotion ? (
            topCard
          ) : (
            <motion.span
              key={remaining}
              initial={{ y: -6, opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="absolute inset-0"
            >
              {topCard}
            </motion.span>
          )
        ) : (
          <span className="absolute inset-0 flex items-center justify-center rounded-xl border-2 border-dashed border-subtle text-xs font-medium text-muted">
            {t('game.emptyStack')}
          </span>
        )}
        <span className="absolute -right-2 -top-2 z-10 rounded-full border border-subtle bg-surface px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-default shadow">
          {remaining}
        </span>
      </button>

      <div className="flex h-36 w-24 items-center justify-center" data-testid={`reveal-slot-${stack}`}>
        {lastEvent && (
          <div key={lastEvent.turn}>
            <PlayingCard
              stack={stack}
              reward={lastEvent.reward}
              hadPenalty={lastEvent.hadPenalty}
              penalty={lastEvent.penalty}
              revealed
              flipped
            />
          </div>
        )}
      </div>

      <div className="text-center">
        <div className="text-sm font-semibold text-default">{t('game.stackName', { stack })}</div>
        <div className="text-xs text-muted">
          <span>{t('game.stackRewardLabel', { reward })}</span>
          {' · '}
          <span>{t('game.remainingCount', { count: remaining })}</span>
        </div>
      </div>
    </div>
  );
}
