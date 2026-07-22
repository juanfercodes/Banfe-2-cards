import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import type { TurnEvent } from '@/lib/gameEngine';
import type { StackId } from '@/lib/protocol';
import { PlayingCard } from './PlayingCard';

export interface DiscardPileProps {
  stack: StackId;
  events: TurnEvent[];
}

const MAX_VISIBLE_UNDERCARDS = 5;
const ROTATIONS = [-2.5, 1.5, -1, 2, 0.5] as const;
const X_JITTER = [-2, 1.5, -1, 2, -0.5] as const;

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
        {count > 0 && (
          <span
            className="absolute -bottom-2.5 left-1/2 h-3 -translate-x-1/2 rounded-full bg-black/50 blur-md"
            style={{ width: `${Math.min(70 + count * 2, 92)}%` }}
          />
        )}

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
                transform: `translate(${X_JITTER[i % X_JITTER.length]!}px, ${
                  depth * 2
                }px) rotate(${ROTATIONS[i % ROTATIONS.length]!}deg)`,
              }}
            />
          );
        })}

        {lastEvent &&
          (reducedMotion ? (
            <div className="absolute inset-0">{topCard}</div>
          ) : (
            <motion.div
              key={lastEvent.turn}
              initial={{ y: -140, opacity: 0, scale: 0.9, rotate: 5 }}
              animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="absolute inset-0"
            >
              {topCard}
            </motion.div>
          ))}

        {count > 0 && (
          <span className="absolute -right-2 -top-3 z-10 rounded-full border border-subtle bg-raised px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-default shadow">
            {count}
          </span>
        )}

        {penalties > 0 && (
          <span
            data-testid={`discard-pile-penalties-${stack}`}
            className="absolute -left-2 -top-3 z-10 inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-red-400 shadow-sm"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                clipRule="evenodd"
              />
            </svg>
            {t('game.pilePenaltyBadge', { count: penalties })}
          </span>
        )}
      </div>
    </div>
  );
}
