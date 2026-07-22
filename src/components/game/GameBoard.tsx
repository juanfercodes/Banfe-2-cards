import { useTranslation } from 'react-i18next';

import type { TurnEvent } from '@/lib/gameEngine';
import { CONTINGENCIES, SHORT_TOTAL_TURNS, type StackId } from '@/lib/protocol';
import type { ScoreSummary } from '@/lib/scoring';
import { useGameContext } from './GameContext';
import { ScoreBar } from './ScoreBar';
import { Stack } from './Stack';
import { Button, Card, Layout } from '../ui';

export type GameFinishHandler = (summary: ScoreSummary, events: TurnEvent[], seed: number) => void;

export interface GameBoardProps {
  onFinish?: GameFinishHandler | undefined;
  subtitle?: string | undefined;
}

export function GameBoard({ onFinish, subtitle }: GameBoardProps) {
  const { t } = useTranslation();
  const { state, summary, draw, reset, canDraw, remaining, isFinished, seed } = useGameContext();

  const lastEvent = state.events[state.events.length - 1] ?? null;
  const isShort = state.totalTurns === SHORT_TOTAL_TURNS;

  return (
    <Layout>
      <ScoreBar
        runningTotal={state.runningTotal}
        turn={state.turn}
        totalTurns={state.totalTurns}
        penalizations={summary.penalizations}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-default">{t('game.title')}</h1>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        <Button variant="secondary" size="sm" onClick={() => reset()}>
          {t('game.restart')}
        </Button>
      </div>

      {isShort && (
        <Card padding="sm" className="mt-4 border-accent/40 bg-accent/5" role="note">
          <p className="font-semibold text-default">{t('game.shortModeTitle')}</p>
          <p className="text-sm text-muted">
            {t('game.shortModeBody', { turns: state.totalTurns })}
          </p>
        </Card>
      )}

      <div className="mt-8 grid grid-cols-2 justify-items-center gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
        {CONTINGENCIES.map(({ stack, reward }) => (
          <Stack
            key={stack}
            stack={stack}
            reward={reward}
            remaining={remaining(stack)}
            canDraw={canDraw(stack)}
            onDraw={(s: StackId) => draw(s)}
            lastEvent={lastEvent?.stack === stack ? lastEvent : null}
          />
        ))}
      </div>

      {isFinished && (
        <Card padding="md" className="mt-8 text-center" aria-live="polite">
          <p className="text-lg font-semibold text-default">{t('game.finished')}</p>
          <Button
            className="mt-3"
            onClick={() => onFinish?.(summary, state.events, seed)}
          >
            {t('game.seeResults')}
          </Button>
        </Card>
      )}
    </Layout>
  );
}
