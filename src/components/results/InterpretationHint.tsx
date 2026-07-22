import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui';
import type { ScoreSummary } from '@/lib/scoring';

import { interpret } from './interpret';

export interface InterpretationHintProps {
  summary: ScoreSummary;
}

export function InterpretationHint({ summary }: InterpretationHintProps) {
  const { t } = useTranslation();
  const { textKey } = interpret(summary);

  return (
    <Card>
      <p className="text-sm text-default">{t(textKey)}</p>
      <p className="mt-2 text-xs italic text-muted">{t('results.disclaimer')}</p>
    </Card>
  );
}
