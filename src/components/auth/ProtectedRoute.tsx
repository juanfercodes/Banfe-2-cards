import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { Layout } from '../ui/Layout';
import { Spinner } from '../ui/Spinner';
import { useAuth } from './useAuth';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
