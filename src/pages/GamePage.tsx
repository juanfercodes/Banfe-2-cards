import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { GameBoard, GameProvider, VersionSelector } from '@/components/game';
import type { TurnEvent } from '@/lib/gameEngine';
import type { GameVersion } from '@/lib/protocol';
import type { ScoreSummary } from '@/lib/scoring';

export interface GamePageFinishPayload {
  patientId: string;
  summary: ScoreSummary;
  events: TurnEvent[];
  seed: number;
}

export interface GamePageProps {
  onFinish?: ((payload: GamePageFinishPayload) => void) | undefined;
}

export default function GamePage({ onFinish }: GamePageProps) {
  const { t } = useTranslation();
  const { patientId = '' } = useParams<{ patientId: string }>();
  const [version, setVersion] = useState<GameVersion | null>(null);

  const subtitle = t('game.patientLabel', { id: patientId });

  if (!version) {
    return <VersionSelector subtitle={subtitle} onStart={setVersion} />;
  }

  return (
    <GameProvider totalTurns={version.totalTurns} deckSizePerStack={version.deckSizePerStack}>
      <GameBoard
        subtitle={subtitle}
        onFinish={(summary, events, seed) => onFinish?.({ patientId, summary, events, seed })}
      />
    </GameProvider>
  );
}
