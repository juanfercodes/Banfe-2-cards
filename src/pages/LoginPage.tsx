import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LoginForm, type LoginFormMode } from '@/components/auth/LoginForm';
import { Card } from '@/components/ui/Card';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { cn } from '@/components/ui/cn';

export default function LoginPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<LoginFormMode>('signIn');

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-base px-4 py-10">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-sm" padding="lg">
        <h1 className="mb-1 text-center text-2xl font-bold text-default">{t('common.appName')}</h1>
        <p className="mb-6 text-center text-sm text-muted">{t('auth.welcome')}</p>

        <div role="tablist" className="mb-6 flex rounded-lg border border-subtle p-1">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signIn'}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent',
              mode === 'signIn' ? 'bg-accent text-white' : 'text-muted hover:text-default',
            )}
            onClick={() => setMode('signIn')}
          >
            {t('auth.signIn')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signUp'}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent',
              mode === 'signUp' ? 'bg-accent text-white' : 'text-muted hover:text-default',
            )}
            onClick={() => setMode('signUp')}
          >
            {t('auth.signUp')}
          </button>
        </div>

        <LoginForm key={mode} mode={mode} />
      </Card>
    </div>
  );
}
