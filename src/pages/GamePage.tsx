import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { GameBoard, GameProvider } from '@/components/game';
import type { TurnEvent } from '@/lib/gameEngine';
import type { ScoreSummary } from '@/lib/scoring';

export interface GamePageFinishPayload {
  patientId: string;
  summary: ScoreSummary;
  events: TurnEvent[];
}

export interface GamePageProps {
  onFinish?: ((payload: GamePageFinishPayload) => void) | undefined;
}

export default function GamePage({ onFinish }: GamePageProps) {
  const { t } = useTranslation();
  const { patientId = '' } = useParams<{ patientId: string }>();

  const subtitle = t('game.patientLabel', { id: patientId });

  return (
    <GameProvider>
      <GameBoard
        subtitle={subtitle}
        onFinish={(summary, events) => onFinish?.({ patientId, summary, events })}
      />
    </GameProvider>
  );
}
