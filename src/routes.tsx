/* eslint-disable react-refresh/only-export-components */

import { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';

import { ProtectedRoute } from './components/auth/ProtectedRoute';

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
        element: (
          <Suspended>
            <GamePage />
          </Suspended>
        ),
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
