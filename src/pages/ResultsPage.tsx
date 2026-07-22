import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  DrawsPerStackChart,
  InterpretationHint,
  LearningCurveChart,
  PerStackBreakdown,
  computeTendency,
} from '@/components/results';
import { Button, StatCard } from '@/components/ui';
import type { TurnEvent } from '@/lib/gameEngine';
import type { ScoreSummary } from '@/lib/scoring';

export interface ResultsRouteState {
  summary: ScoreSummary;
  events: TurnEvent[];
  startedAt?: string;
  endedAt?: string;
  patientCode?: string;
}

export interface ResultsExportPayload {
  summary: ScoreSummary;
  events: TurnEvent[];
}

export interface ResultsPageProps {
  onExport?: (payload: ResultsExportPayload) => void;
}

function isResultsRouteState(value: unknown): value is ResultsRouteState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'summary' in value &&
    'events' in value
  );
}

export default function ResultsPage({ onExport }: ResultsPageProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const state = isResultsRouteState(location.state) ? location.state : null;

  if (!state) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-default">{t('results.noData')}</p>
        <Button onClick={() => void navigate('/')}>{t('results.backToDashboard')}</Button>
      </div>
    );
  }

  const { summary, events, startedAt, endedAt, patientCode } = state;
  const totalDraws = Object.values(summary.drawsPerStack).reduce((sum, n) => sum + n, 0);
  const tendency = computeTendency(summary.advantageDisadvantageIndex);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-default">{t('results.title')}</h1>
          {(startedAt || patientCode) && (
            <p className="text-sm text-muted">
              {patientCode && <span>{patientCode} · </span>}
              {startedAt && <span>{new Date(startedAt).toLocaleString()}</span>}
              {endedAt && <span> – {new Date(endedAt).toLocaleString()}</span>}
            </p>
          )}
        </div>
        <Button variant="secondary" onClick={() => void navigate('/')}>
          {t('results.backToDashboard')}
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('results.totalNet')} value={summary.totalNet} />
        <StatCard
          label={t('results.advDisadvIndex')}
          value={summary.advantageDisadvantageIndex}
          sublabel={t(`results.${tendency}`)}
        />
        <StatCard label={t('results.penalizations')} value={summary.penalizations} />
        <StatCard label={t('results.totalDraws')} value={totalDraws} />
      </div>

      <PerStackBreakdown summary={summary} />
      <LearningCurveChart learningCurve={summary.learningCurve} />
      <DrawsPerStackChart drawsPerStack={summary.drawsPerStack} />
      <InterpretationHint summary={summary} />

      <div>
        <Button onClick={() => onExport?.({ summary, events })}>{t('results.export')}</Button>
      </div>
    </div>
  );
}
