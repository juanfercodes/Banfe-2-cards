import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
  CumulativeNetChart,
  DrawsPerStackChart,
  InterpretationHint,
  PerStackBreakdown,
  computeTendency,
} from '@/components/results';
import { Badge, Button, Card, Spinner, StatCard } from '@/components/ui';
import { getPatient, getSession, sessionToScoreSummary } from '@/lib/dataAccess';
import { exportSessionsToFile, type SessionExportRow } from '@/lib/export';
import type { TurnEvent } from '@/lib/gameEngine';
import type { ScoreSummary } from '@/lib/scoring';

export interface ResultsRouteState {
  summary: ScoreSummary;
  events: TurnEvent[];
  startedAt?: string | undefined;
  endedAt?: string | undefined;
  patientCode?: string | undefined;
}

export interface ResultsExportPayload {
  summary: ScoreSummary;
  events: TurnEvent[];
}

export interface ResultsPageProps {
  onExport?: (payload: ResultsExportPayload) => void;
}

interface ResolvedResults {
  summary: ScoreSummary;
  events: TurnEvent[];
  startedAt?: string | undefined;
  endedAt?: string | undefined;
  patientCode?: string | undefined;
}

type Remote =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: ResolvedResults }
  | { status: 'notFound' };

function isResultsRouteState(value: unknown): value is ResultsRouteState {
  return typeof value === 'object' && value !== null && 'summary' in value && 'events' in value;
}

export default function ResultsPage({ onExport }: ResultsPageProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId = '' } = useParams<{ sessionId: string }>();

  const routeState = isResultsRouteState(location.state) ? location.state : null;

  const [remote, setRemote] = useState<Remote>(() => {
    if (routeState) return { status: 'idle' };
    if (!sessionId) return { status: 'notFound' };
    return { status: 'loading' };
  });

  useEffect(() => {
    if (routeState || !sessionId) return;
    let active = true;
    void (async () => {
      setRemote({ status: 'loading' });
      try {
        const session = await getSession(sessionId);
        if (!active) return;
        if (!session) {
          setRemote({ status: 'notFound' });
          return;
        }
        const patient = await getPatient(session.patientId);
        if (!active) return;
        setRemote({
          status: 'ready',
          data: {
            summary: sessionToScoreSummary(session),
            events: session.rawEvents,
            startedAt: session.startedAt,
            endedAt: session.endedAt ?? undefined,
            patientCode: patient?.code,
          },
        });
      } catch {
        if (active) setRemote({ status: 'notFound' });
      }
    })();
    return () => {
      active = false;
    };
  }, [routeState, sessionId]);

  let data: ResolvedResults | null = null;
  if (routeState) {
    data = {
      summary: routeState.summary,
      events: routeState.events,
      startedAt: routeState.startedAt,
      endedAt: routeState.endedAt,
      patientCode: routeState.patientCode,
    };
  } else if (remote.status === 'ready') {
    data = remote.data;
  }

  if (!data) {
    if (remote.status === 'notFound') {
      return (
        <div className="mx-auto max-w-3xl p-4">
          <Card padding="lg" className="text-center shadow-card">
            <p className="text-default">{t('results.noData')}</p>
            <Button className="mt-4" onClick={() => void navigate('/')}>
              {t('results.backToDashboard')}
            </Button>
          </Card>
        </div>
      );
    }
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <Spinner size="lg" />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    );
  }

  const { summary, events, startedAt, endedAt, patientCode } = data;
  const totalDraws = Object.values(summary.drawsPerStack).reduce((sum, n) => sum + n, 0);
  const tendency = computeTendency(summary.advantageDisadvantageIndex);

  const handleExport = () => {
    if (onExport) {
      onExport({ summary, events });
      return;
    }
    const locale = i18n.language.startsWith('en') ? 'en' : 'es';
    const row: SessionExportRow = {
      patientCode: patientCode ?? '—',
      startedAt: startedAt ?? new Date(0).toISOString(),
      endedAt: endedAt ?? null,
      turnCount: events.length,
      totalNet: summary.totalNet,
      penalizations: summary.penalizations,
      advantageDisadvantageIndex: summary.advantageDisadvantageIndex,
      perStack: summary.perStack,
    };
    exportSessionsToFile([row], locale);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-default">{t('results.title')}</h1>
            {patientCode && <Badge variant="info">{patientCode}</Badge>}
          </div>
          {(startedAt || endedAt) && (
            <p className="mt-1 text-sm text-muted">
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
      <CumulativeNetChart events={events} />
      <DrawsPerStackChart drawsPerStack={summary.drawsPerStack} />
      <InterpretationHint summary={summary} events={events} />

      <div>
        <Button onClick={handleExport}>{t('results.export')}</Button>
      </div>
    </div>
  );
}
