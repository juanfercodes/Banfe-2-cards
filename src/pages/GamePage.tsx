import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';

import { GameBoard, GameProvider } from '@/components/game';
import type { TurnEvent } from '@/lib/gameEngine';
import { SHORT_TOTAL_TURNS, TOTAL_TURNS } from '@/lib/protocol';
import type { ScoreSummary } from '@/lib/scoring';

export interface GamePageFinishPayload {
  patientId: string;
  summary: ScoreSummary;
  events: TurnEvent[];
  seed: number;
}

export interface GamePageProps {
  shortMode?: boolean | undefined;
  onFinish?: ((payload: GamePageFinishPayload) => void) | undefined;
}

export default function GamePage({ shortMode, onFinish }: GamePageProps) {
  const { t } = useTranslation();
  const { patientId = '' } = useParams<{ patientId: string }>();
  const [searchParams] = useSearchParams();

  const isShort = shortMode ?? searchParams.get('short') === '1';
  const totalTurns = isShort ? SHORT_TOTAL_TURNS : TOTAL_TURNS;

  return (
    <GameProvider totalTurns={totalTurns}>
      <GameBoard
        subtitle={t('game.patientLabel', { id: patientId })}
        onFinish={(summary, events, seed) => onFinish?.({ patientId, summary, events, seed })}
      />
    </GameProvider>
  );
}
