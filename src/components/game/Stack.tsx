import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import type { TurnEvent } from '@/lib/gameEngine';
import type { StackId } from '@/lib/protocol';
import { DiscardPile } from './DiscardPile';
import { cn } from '../ui/cn';

export interface StackProps {
  stack: StackId;
  reward: number;
  remaining: number;
  canDraw: boolean;
  onDraw: (stack: StackId) => void;
  events: TurnEvent[];
}

const pileCard = 'absolute inset-0 rounded-xl border border-white/15';
const pileBack = 'bg-gradient-to-br from-accent to-accent/70';

const DECK_SHADOW: Record<number, string> = {
  1: 'shadow-sm',
  2: 'shadow',
  3: 'shadow-md',
  4: 'shadow-lg',
  5: 'shadow-xl shadow-accent/25',
};

export function Stack({ stack, reward, remaining, canDraw, onDraw, events }: StackProps) {
  const { t } = useTranslation();
  const reducedMotion = usePrefersReducedMotion();

  const shadow = DECK_SHADOW[reward] ?? 'shadow';

  const topCard = (
    <span
      aria-hidden="true"
      className={cn(pileCard, pileBack, shadow, 'flex items-center justify-center')}
    >
      <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 via-transparent to-black/20" />
      <span className="relative flex h-[calc(100%-12px)] w-[calc(100%-12px)] flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-white/40 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.25)_1px,transparent_1px)] bg-[length:10px_10px]">
        <span className="rounded-md bg-white/15 px-2 py-0.5 text-2xl font-black tabular-nums text-white drop-shadow">
          +{reward}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
          {t('game.stackName', { stack })}
        </span>
      </span>
    </span>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        disabled={!canDraw}
        onClick={() => onDraw(stack)}
        aria-label={t('game.stackAria', { stack, reward, remaining })}
        className={cn(
          'relative h-36 w-24 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          canDraw &&
            !reducedMotion &&
            'transition-[transform,filter] hover:-translate-y-1.5 hover:brightness-110 active:translate-y-0 active:brightness-95',
          !canDraw && 'cursor-not-allowed',
        )}
      >
        <span
          aria-hidden="true"
          className="absolute -inset-2 rounded-2xl bg-black/25 ring-1 ring-inset ring-white/5"
        />
        {remaining > 2 && (
          <span
            aria-hidden="true"
            className={cn(pileCard, pileBack, 'left-1.5 top-1.5 opacity-60 shadow-sm')}
          />
        )}
        {remaining > 1 && (
          <span
            aria-hidden="true"
            className={cn(pileCard, pileBack, 'left-0.5 top-0.5 opacity-80 shadow-sm')}
          />
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
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-subtle bg-surface/40 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('game.emptyStack')}
          </span>
        )}
        <span className="absolute -right-2 -top-2 z-10 rounded-full border border-subtle bg-raised px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-default shadow">
          {remaining}
        </span>
      </button>

      <DiscardPile stack={stack} events={events} />

      <div className="text-center">
        <div className="text-sm font-bold text-default">{t('game.stackName', { stack })}</div>
        <div className="text-xs text-muted">
          <span className="font-semibold tabular-nums text-default/80">
            {t('game.stackRewardLabel', { reward })}
          </span>
          {' · '}
          <span>{t('game.remainingCount', { count: remaining })}</span>
        </div>
      </div>
    </div>
  );
}
