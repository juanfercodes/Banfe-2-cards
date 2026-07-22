/* eslint-disable react-refresh/only-export-components */

import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { getPatient, saveSession } from './lib/dataAccess';
import type { GamePageFinishPayload } from './pages/GamePage';
import type { ResultsRouteState } from './pages/ResultsPage';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PatientNewPage = lazy(() => import('./pages/PatientNewPage'));
const GamePage = lazy(() => import('./pages/GamePage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));

function PageLoader() {
  return <div className="p-8 text-center">Loading...</div>;
}

function Suspended({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function GameRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { patientId = '' } = useParams<{ patientId: string }>();
  const startedAtRef = useRef<string>(new Date().toISOString());
  const patientCodeRef = useRef<string | undefined>(undefined);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getPatient(patientId)
      .then((patient) => {
        if (active && patient) patientCodeRef.current = patient.code;
      })
      .catch(() => {
        /* patient code is cosmetic on the results header; ignore lookup errors */
      });
    return () => {
      active = false;
    };
  }, [patientId]);

  const handleFinish = useCallback(
    async ({ summary, events }: GamePageFinishPayload) => {
      setSaveError(null);
      try {
        const endedAt = new Date().toISOString();
        const session = await saveSession({
          patientId,
          summary,
          events,
          startedAt: startedAtRef.current,
          endedAt,
        });
        const state: ResultsRouteState = {
          summary,
          events,
          startedAt: session.startedAt,
          endedAt: session.endedAt ?? endedAt,
          patientCode: patientCodeRef.current,
        };
        void navigate(`/results/${session.id}`, { state });
      } catch {
        setSaveError(t('game.saveError'));
      }
    },
    [navigate, patientId, t],
  );

  return (
    <Suspended>
      {saveError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400"
        >
          {saveError}
        </div>
      )}
      <GamePage onFinish={(payload) => void handleFinish(payload)} />
    </Suspended>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspended>
        <LoginPage />
      </Suspended>
    ),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: (
          <Suspended>
            <DashboardPage />
          </Suspended>
        ),
      },
      {
        path: '/patients/new',
        element: (
          <Suspended>
            <PatientNewPage />
          </Suspended>
        ),
      },
      {
        path: '/play/:patientId',
        element: <GameRoute />,
      },
      {
        path: '/results/:sessionId',
        element: (
          <Suspended>
            <ResultsPage />
          </Suspended>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

export function Routes() {
  return <RouterProvider router={router} />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
}
