import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { Button, Card, Layout, Spinner } from '@/components/ui';
import { HistoryTable, StatsCards } from '@/components/dashboard';
import { listAllSessions, listPatients, type Patient, type Session } from '@/lib/dataAccess';

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumePatientId, setResumePatientId] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([listPatients(), listAllSessions()])
      .then(([patientsResult, sessionsResult]) => {
        if (!active) return;
        setPatients(patientsResult);
        setSessions(sessionsResult);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleResume = () => {
    if (resumePatientId) void navigate(`/play/${resumePatientId}`);
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-default">{t('dashboard.title')}</h1>
      <p className="mt-1 text-muted">{t('dashboard.welcome')}</p>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <Spinner />
        </div>
      ) : error ? (
        <Card className="mt-6 text-red-400" role="alert">
          {error}
        </Card>
      ) : patients.length === 0 ? (
        <Card className="mt-6 text-center" padding="lg">
          <p className="text-muted">{t('dashboard.history.empty')}</p>
          <Link to="/patients/new" className="mt-4 inline-block">
            <Button>{t('dashboard.newPatient')}</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="mt-6">
            <StatsCards patients={patients} sessions={sessions} />
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-3">
            <Link to="/patients/new">
              <Button>{t('dashboard.newPatient')}</Button>
            </Link>
            <label className="flex flex-col text-sm text-muted">
              {t('dashboard.resumePatient')}
              <select
                value={resumePatientId}
                onChange={(e) => setResumePatientId(e.target.value)}
                className="rounded-lg border border-subtle bg-surface px-3 py-2 text-sm text-default focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">—</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="secondary" onClick={handleResume} disabled={!resumePatientId}>
              {t('dashboard.resumePatientCta')}
            </Button>
          </div>

          <div className="mt-6">
            <HistoryTable patients={patients} sessions={sessions} />
          </div>
        </>
      )}
    </Layout>
  );
}
