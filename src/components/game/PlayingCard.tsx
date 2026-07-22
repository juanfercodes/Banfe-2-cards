import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import type { StackId } from '@/lib/protocol';
import { cn } from '../ui/cn';

export interface PlayingCardProps {
  stack: StackId;
  reward: number;
  hadPenalty: boolean;
  penalty: number;
  revealed: boolean;
  flipped: boolean;
}

const faceBase =
  'absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-subtle shadow-md';

function CardBack({ label }: { label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        faceBase,
        'bg-gradient-to-br from-accent to-accent/70 [backface-visibility:hidden]',
      )}
    >
      <div className="flex h-[calc(100%-12px)] w-[calc(100%-12px)] items-center justify-center rounded-lg border-2 border-white/40 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.25)_1px,transparent_1px)] bg-[length:10px_10px]">
        <span className="text-xl font-black text-white/80">B2</span>
      </div>
    </div>
  );
}

function CardFront({
  stack,
  reward,
  hadPenalty,
  penalty,
  reducedMotion,
}: {
  stack: StackId;
  reward: number;
  hadPenalty: boolean;
  penalty: number;
  reducedMotion: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div
      data-testid="card-front"
      className={cn(faceBase, 'gap-1 bg-surface text-default ring-1 ring-inset ring-subtle')}
    >
      <span data-testid="card-reward" className="text-3xl font-bold tabular-nums text-default">
        +{reward}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-muted">
        {t('game.stackName', { stack })}
      </span>
      {hadPenalty &&
        (reducedMotion ? (
          <span
            data-testid="penalty-chip"
            aria-label={t('game.penaltyChipAria', { penalty: Math.abs(penalty) })}
            className="absolute bottom-2 rounded-full bg-red-600 px-2 py-0.5 text-sm font-bold tabular-nums text-white shadow"
          >
            {penalty}
          </span>
        ) : (
          <motion.span
            data-testid="penalty-chip"
            aria-label={t('game.penaltyChipAria', { penalty: Math.abs(penalty) })}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, x: [0, -4, 4, -2, 2, 0] }}
            transition={{ duration: 0.45, delay: 0.35 }}
            className="absolute bottom-2 rounded-full bg-red-600 px-2 py-0.5 text-sm font-bold tabular-nums text-white shadow"
          >
            {penalty}
          </motion.span>
        ))}
      {!reducedMotion && (
        <motion.span
          data-testid="reward-float"
          aria-hidden="true"
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -36 }}
          transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
          className="pointer-events-none absolute -top-2 text-lg font-bold text-accent"
        >
          +{reward}
        </motion.span>
      )}
    </div>
  );
}

export function PlayingCard({
  stack,
  reward,
  hadPenalty,
  penalty,
  revealed,
  flipped,
}: PlayingCardProps) {
  const { t } = useTranslation();
  const reducedMotion = usePrefersReducedMotion();
  const showFront = revealed && flipped;
  const backLabel = t('game.cardBackAria');

  if (reducedMotion) {
    return (
      <div className="relative h-36 w-24" data-testid={`playing-card-${stack}`}>
        <div data-testid="card-inner" className="relative h-full w-full">
          {showFront ? (
            <CardFront
              stack={stack}
              reward={reward}
              hadPenalty={hadPenalty}
              penalty={penalty}
              reducedMotion
            />
          ) : (
            <CardBack label={backLabel} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-36 w-24 [perspective:800px]" data-testid={`playing-card-${stack}`}>
      <motion.div
        data-testid="card-inner"
        className="relative h-full w-full [transform-style:preserve-3d]"
        initial={{ rotateY: 0 }}
        animate={{ rotateY: showFront ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 26 }}
      >
        <CardBack label={backLabel} />
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {revealed && (
            <CardFront
              stack={stack}
              reward={reward}
              hadPenalty={hadPenalty}
              penalty={penalty}
              reducedMotion={false}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
