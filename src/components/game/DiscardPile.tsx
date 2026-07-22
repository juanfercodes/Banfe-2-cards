import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import type { TurnEvent } from '@/lib/gameEngine';
import type { StackId } from '@/lib/protocol';
import { PlayingCard } from './PlayingCard';
import { cn } from '../ui/cn';

export interface DiscardPileProps {
  stack: StackId;
  events: TurnEvent[];
}

const MAX_VISIBLE_UNDERCARDS = 7;
const ROTATIONS = [-2.5, 1.5, -1, 2, 0.5, -1.5, 1] as const;

export function DiscardPile({ stack, events }: DiscardPileProps) {
  const { t } = useTranslation();
  const reducedMotion = usePrefersReducedMotion();

  const count = events.length;
  const penalties = events.filter((e) => e.hadPenalty).length;
  const lastEvent = count > 0 ? events[count - 1]! : null;
  const underCount = Math.min(Math.max(count - 1, 0), MAX_VISIBLE_UNDERCARDS);

  const topCard = lastEvent && (
    <PlayingCard
      stack={stack}
      reward={lastEvent.reward}
      hadPenalty={lastEvent.hadPenalty}
      penalty={lastEvent.penalty}
      revealed
      flipped
    />
  );

  return (
    <div className="relative" data-testid={`discard-pile-${stack}`}>
      <p className="sr-only" data-testid={`discard-pile-summary-${stack}`} aria-live="off">
        {t('game.pileSummary', { stack, count, penalties })}
      </p>

      <div aria-hidden="true" className="relative h-36 w-24">
        {count === 0 && (
          <span className="absolute inset-0 flex items-center justify-center rounded-xl border-2 border-dashed border-subtle text-[10px] font-medium uppercase tracking-wide text-muted">
            {t('game.pileEmpty')}
          </span>
        )}

        {Array.from({ length: underCount }, (_, i) => {
          const depth = underCount - i;
          return (
            <span
              key={i}
              className="absolute inset-0 rounded-xl border border-subtle bg-surface shadow-sm"
              style={{
                transform: `translateY(${-depth * 2}px) rotate(${ROTATIONS[i % ROTATIONS.length]!}deg)`,
              }}
            />
          );
        })}

        {lastEvent &&
          (reducedMotion ? (
            <div
              className="absolute inset-0"
              style={{ transform: `translateY(${-(underCount + 1) * 2}px)` }}
            >
              {topCard}
            </div>
          ) : (
            <motion.div
              key={lastEvent.turn}
              initial={{ y: -140, opacity: 0, scale: 0.9 }}
              animate={{ y: -(underCount + 1) * 2, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="absolute inset-0"
            >
              {topCard}
            </motion.div>
          ))}

        {count > 0 && (
          <span className="absolute -right-2 -top-3 z-10 rounded-full border border-subtle bg-surface px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-default shadow">
            {count}
          </span>
        )}

        {penalties > 0 && (
          <span
            data-testid={`discard-pile-penalties-${stack}`}
            className={cn(
              'absolute -bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full border border-red-500/40 bg-red-500/15 px-2 py-0.5',
              'text-[10px] font-semibold tabular-nums text-red-500 shadow-sm',
            )}
          >
            {t('game.pilePenaltyBadge', { count: penalties })}
          </span>
        )}
      </div>
    </div>
  );
}
