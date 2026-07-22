import type { TFunction } from 'i18next';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { supabase } from '@/lib/supabaseClient';

import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from './useAuth';

export type LoginFormMode = 'signIn' | 'signUp';

export interface LoginFormProps {
  mode: LoginFormMode;
}

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function mapAuthError(t: TFunction, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/invalid login credentials/i.test(message)) {
    return t('auth.authError.invalidCredentials');
  }
  if (/already registered|already exists/i.test(message)) {
    return t('auth.authError.emailInUse');
  }
  if (/password/i.test(message) && /(weak|short|least)/i.test(message)) {
    return t('auth.authError.weakPassword');
  }
  return t('auth.authError.unknown');
}

export function LoginForm({ mode }: LoginFormProps) {
  const { t } = useTranslation();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSignUp = mode === 'signUp';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  function validate(): boolean {
    const next: FieldErrors = {};

    if (!email.trim()) {
      next.email = t('auth.validation.emailRequired');
    } else if (!EMAIL_PATTERN.test(email)) {
      next.email = t('auth.validation.emailInvalid');
    }

    if (!password) {
      next.password = t('auth.validation.passwordRequired');
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = t('auth.validation.passwordTooShort');
    }

    if (isSignUp && confirmPassword !== password) {
      next.confirmPassword = t('auth.validation.confirmPasswordMismatch');
    }

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      const state = location.state as { from?: { pathname: string; search?: string } } | null;
      const redirectTo = state?.from ? `${state.from.pathname}${state.from.search ?? ''}` : '/';
      void navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(mapAuthError(t, error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setFormError(null);
    setResetSent(false);
    if (!email.trim() || !EMAIL_PATTERN.test(email)) {
      setFieldErrors((prev) => ({ ...prev, email: t('auth.validation.emailInvalid') }));
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setResetSent(true);
    } catch (error) {
      setFormError(mapAuthError(t, error));
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col gap-4">
      <Input
        label={t('auth.email')}
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        {...(fieldErrors.email ? { error: fieldErrors.email } : {})}
      />
      <Input
        label={t('auth.password')}
        type="password"
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        {...(fieldErrors.password ? { error: fieldErrors.password } : {})}
      />
      {isSignUp && (
        <Input
          label={t('auth.confirmPassword')}
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          {...(fieldErrors.confirmPassword ? { error: fieldErrors.confirmPassword } : {})}
        />
      )}
      {formError && (
        <p role="alert" className="text-sm text-red-500">
          {formError}
        </p>
      )}
      {resetSent && (
        <p role="status" className="text-sm text-accent">
          {t('auth.resetPasswordSuccess')}
        </p>
      )}
      <Button type="submit" isLoading={submitting}>
        {isSignUp ? t('auth.signUp') : t('auth.signIn')}
      </Button>
      {!isSignUp && (
        <button
          type="button"
          onClick={() => void handleForgotPassword()}
          className="text-sm text-muted hover:text-default focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {t('auth.forgotPassword')}
        </button>
      )}
    </form>
  );
}
