/* eslint-disable react-refresh/only-export-components */

import { useTranslation } from 'react-i18next';

import { StatCard } from '@/components/ui';
import type { Patient, Session } from '@/lib/dataAccess';

export interface DashboardStats {
  totalPatients: number;
  totalSessions: number;
  avgTotalNet: number;
  avgAdvantageDisadvantageIndex: number;
  lastSessionDate: string | null;
}

export type IndexCategory = 'advantageous' | 'disadvantageous' | 'neutral';

export function classifyIndex(index: number): IndexCategory {
  if (index > 0) return 'advantageous';
  if (index < 0) return 'disadvantageous';
  return 'neutral';
}

export function computeDashboardStats(patients: Patient[], sessions: Session[]): DashboardStats {
  const totalPatients = patients.length;
  const totalSessions = sessions.length;

  if (totalSessions === 0) {
    return {
      totalPatients,
      totalSessions,
      avgTotalNet: 0,
      avgAdvantageDisadvantageIndex: 0,
      lastSessionDate: null,
    };
  }

  const avgTotalNet = sessions.reduce((sum, s) => sum + s.totalNet, 0) / totalSessions;
  const avgAdvantageDisadvantageIndex =
    sessions.reduce((sum, s) => sum + s.advDisadvIndex, 0) / totalSessions;
  const lastSessionDate = sessions.reduce<string | null>(
    (latest, s) => (!latest || s.startedAt > latest ? s.startedAt : latest),
    null,
  );

  return { totalPatients, totalSessions, avgTotalNet, avgAdvantageDisadvantageIndex, lastSessionDate };
}

export interface StatsCardsProps {
  patients: Patient[];
  sessions: Session[];
}

export function StatsCards({ patients, sessions }: StatsCardsProps) {
  const { t, i18n } = useTranslation();
  const stats = computeDashboardStats(patients, sessions);
  const category = classifyIndex(stats.avgAdvantageDisadvantageIndex);
  const dateFormatter = new Intl.DateTimeFormat(i18n.language.startsWith('en') ? 'en-US' : 'es-ES', {
    dateStyle: 'medium',
  });

  const hasSessions = stats.totalSessions > 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard label={t('dashboard.stats.totalPatients')} value={stats.totalPatients} />
      <StatCard label={t('dashboard.stats.totalSessions')} value={stats.totalSessions} />
      <StatCard
        label={t('dashboard.stats.avgNet')}
        value={hasSessions ? stats.avgTotalNet.toFixed(1) : '—'}
      />
      <StatCard
        label={t('dashboard.stats.avgIndex')}
        value={hasSessions ? stats.avgAdvantageDisadvantageIndex.toFixed(1) : '—'}
        {...(hasSessions ? { sublabel: t(`dashboard.history.filter.${category}`) } : {})}
      />
      <StatCard
        label={t('dashboard.stats.lastSession')}
        value={stats.lastSessionDate ? dateFormatter.format(new Date(stats.lastSessionDate)) : '—'}
      />
    </div>
  );
}
