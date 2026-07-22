import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { TurnEvent } from '@/lib/gameEngine';
import { CONTINGENCIES, type StackId } from '@/lib/protocol';
import type { ScoreSummary } from '@/lib/scoring';
import { useGameContext } from './GameContext';
import { ScoreBar } from './ScoreBar';
import { Stack } from './Stack';
import { Button, Card } from '../ui';

export type GameFinishHandler = (summary: ScoreSummary, events: TurnEvent[]) => void;

export interface GameBoardProps {
  onFinish?: GameFinishHandler | undefined;
  subtitle?: string | undefined;
}

const ALL_STACKS: readonly StackId[] = [1, 2, 3, 4, 5] as const;

export function GameBoard({ onFinish, subtitle }: GameBoardProps) {
  const { t } = useTranslation();
  const { state, summary, draw, reset, canDraw, remaining, isFinished } = useGameContext();

  const eventsByStack = useMemo(() => {
    const map = {} as Record<StackId, TurnEvent[]>;
    for (const s of ALL_STACKS) map[s] = [];
    for (const ev of state.events) map[ev.stack].push(ev);
    return map;
  }, [state.events]);

  return (
    <>
      <ScoreBar
        timeRemainingMs={state.timeRemainingMs}
        turn={state.turn}
        totalTurns={state.totalTurns}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-default">{t('game.title')}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        <Button variant="secondary" size="sm" onClick={() => reset()}>
          {t('game.restart')}
        </Button>
      </div>

      <section
        aria-label={t('game.boardLabel')}
        className="relative mt-6 overflow-hidden rounded-3xl border border-subtle bg-felt p-4 shadow-card ring-1 ring-inset ring-white/5 sm:p-8"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/10 via-transparent to-transparent"
        />
        <div className="relative grid grid-cols-2 justify-items-center gap-x-4 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
          {CONTINGENCIES.map(({ stack, reward }) => (
            <Stack
              key={stack}
              stack={stack}
              reward={reward}
              remaining={remaining(stack)}
              canDraw={canDraw(stack)}
              onDraw={(s: StackId) => draw(s)}
              events={eventsByStack[stack]}
            />
          ))}
        </div>
      </section>

      {isFinished && (
        <Card padding="lg" className="mt-8 text-center shadow-card" aria-live="polite">
          <p className="text-lg font-semibold text-default">{t('game.finished')}</p>
          <Button className="mt-5" size="lg" onClick={() => onFinish?.(summary, state.events)}>
            {t('game.seeResults')}
          </Button>
        </Card>
      )}
    </>
  );
}
