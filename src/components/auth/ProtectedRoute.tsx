import { Outlet } from 'react-router-dom';

import { Layout } from '../ui/Layout';

export function ProtectedRoute() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
