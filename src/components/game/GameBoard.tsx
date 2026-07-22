import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { TurnEvent } from '@/lib/gameEngine';
import { CONTINGENCIES, type StackId } from '@/lib/protocol';
import type { ScoreSummary } from '@/lib/scoring';
import { useGameContext } from './GameContext';
import { ScoreBar } from './ScoreBar';
import { Stack } from './Stack';
import { Button, Card } from '../ui';

export type GameFinishHandler = (summary: ScoreSummary, events: TurnEvent[], seed: number) => void;

export interface GameBoardProps {
  onFinish?: GameFinishHandler | undefined;
  subtitle?: string | undefined;
}

const ALL_STACKS: readonly StackId[] = [1, 2, 3, 4, 5] as const;

export function GameBoard({ onFinish, subtitle }: GameBoardProps) {
  const { t } = useTranslation();
  const { state, summary, draw, reset, canDraw, remaining, isFinished, seed } = useGameContext();

  const eventsByStack = useMemo(() => {
    const map = {} as Record<StackId, TurnEvent[]>;
    for (const s of ALL_STACKS) map[s] = [];
    for (const ev of state.events) map[ev.stack].push(ev);
    return map;
  }, [state.events]);

  return (
    <>
      <ScoreBar
        runningTotal={state.runningTotal}
        turn={state.turn}
        totalTurns={state.totalTurns}
        penalizations={summary.penalizations}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-default">{t('game.title')}</h1>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        <Button variant="secondary" size="sm" onClick={() => reset()}>
          {t('game.restart')}
        </Button>
      </div>

      <div className="mt-6 rounded-3xl border border-subtle bg-gradient-to-b from-surface via-surface to-accent/5 p-4 shadow-inner sm:p-8">
        <div className="grid grid-cols-2 justify-items-center gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
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
      </div>

      {isFinished && (
        <Card padding="md" className="mt-8 text-center" aria-live="polite">
          <p className="text-lg font-semibold text-default">{t('game.finished')}</p>
          <Button className="mt-3" onClick={() => onFinish?.(summary, state.events, seed)}>
            {t('game.seeResults')}
          </Button>
        </Card>
      )}
    </>
  );
}
