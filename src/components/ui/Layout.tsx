import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../auth/useAuth';
import { Button } from './Button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { cn } from './cn';

export interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    void logout().then(() => navigate('/login'));
  };

  return (
    <div className="min-h-screen bg-base">
      <header className="border-b border-subtle bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-bold text-default hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent">
            {t('common.appName')}
          </Link>
          <nav className="flex items-center gap-4" aria-label={t('nav.dashboard')}>
            <Link to="/" className="text-sm text-muted hover:text-default focus:outline-none focus:ring-2 focus:ring-accent">
              {t('nav.dashboard')}
            </Link>
            <Link to="/patients/new" className="text-sm text-muted hover:text-default focus:outline-none focus:ring-2 focus:ring-accent">
              {t('nav.newPatient')}
            </Link>
            <LanguageSwitcher />
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-muted sm:inline">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                {t('nav.signOut')}
              </Button>
            </div>
          </nav>
        </div>
      </header>
      <main className={cn('mx-auto max-w-6xl px-4 py-6', className)}>{children}</main>
    </div>
  );
}
