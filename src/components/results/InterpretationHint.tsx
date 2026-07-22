import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui';
import type { TurnEvent } from '@/lib/gameEngine';
import { cumulativeNet } from '@/lib/scoring';
import type { ScoreSummary } from '@/lib/scoring';

import { interpret } from './interpret';

export interface InterpretationHintProps {
  summary: ScoreSummary;
  events: TurnEvent[];
}

export function InterpretationHint({ summary, events }: InterpretationHintProps) {
  const { t } = useTranslation();
  const { textKey } = interpret(summary, cumulativeNet(events));

  return (
    <Card className="border-l-4 border-l-accent shadow-card">
      <p className="text-sm leading-relaxed text-default">{t(textKey)}</p>
      <p className="mt-2 text-xs italic text-muted">{t('results.disclaimer')}</p>
    </Card>
  );
}
