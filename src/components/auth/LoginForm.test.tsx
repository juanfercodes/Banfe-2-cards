import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useAuthMock, resetPasswordForEmailMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  resetPasswordForEmailMock: vi.fn(),
}));

vi.mock('./useAuth', () => ({ useAuth: useAuthMock }));
vi.mock('@/lib/supabaseClient', () => ({
  supabase: { auth: { resetPasswordForEmail: resetPasswordForEmailMock } },
}));

import i18n from '@/i18n/index';
import { LanguageProvider } from '@/i18n/LanguageProvider';

import { LoginForm } from './LoginForm';

function LocationStub() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderForm(mode: 'signIn' | 'signUp', initialEntry = '/login') {
  return render(
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/login" element={<LoginForm mode={mode} />} />
            <Route path="*" element={<LocationStub />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </I18nextProvider>,
  );
}

describe('<LoginForm />', () => {
  const signIn = vi.fn();
  const signUp = vi.fn();

  beforeEach(() => {
    signIn.mockReset();
    signUp.mockReset();
    resetPasswordForEmailMock.mockReset();
    useAuthMock.mockReturnValue({ signIn, signUp });
  });

  it('shows a validation error for an empty submit', async () => {
    const user = userEvent.setup();
    renderForm('signIn');

    await user.click(screen.getByRole('button', { name: /iniciar sesión|sign in/i }));

    expect(await screen.findByText(/ingresa tu correo|enter your email/i)).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('shows a validation error for a malformed email', async () => {
    const user = userEvent.setup();
    renderForm('signIn');

    await user.type(screen.getByLabelText(/correo electrónico|email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/^contraseña$|^password$/i), 'longenoughpw');
    await user.click(screen.getByRole('button', { name: /iniciar sesión|sign in/i }));

    expect(await screen.findByText(/correo electrónico válido|valid email/i)).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('shows a validation error for a short password', async () => {
    const user = userEvent.setup();
    renderForm('signIn');

    await user.type(screen.getByLabelText(/correo electrónico|email/i), 'doc@clinic.test');
    await user.type(screen.getByLabelText(/^contraseña$|^password$/i), 'short');
    await user.click(screen.getByRole('button', { name: /iniciar sesión|sign in/i }));

    expect(await screen.findByText(/al menos 8 caracteres|at least 8 characters/i)).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('shows a validation error when signup passwords do not match', async () => {
    const user = userEvent.setup();
    renderForm('signUp');

    await user.type(screen.getByLabelText(/correo electrónico|email/i), 'doc@clinic.test');
    await user.type(screen.getByLabelText(/^contraseña$|^password$/i), 'longenoughpw');
    await user.type(screen.getByLabelText(/confirmar contraseña|confirm password/i), 'different');
    await user.click(screen.getByRole('button', { name: /crear cuenta|create account/i }));

    expect(
      await screen.findByText(/contraseñas no coinciden|passwords do not match/i),
    ).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('calls signIn and navigates to / on success', async () => {
    signIn.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderForm('signIn');

    await user.type(screen.getByLabelText(/correo electrónico|email/i), 'doc@clinic.test');
    await user.type(screen.getByLabelText(/^contraseña$|^password$/i), 'longenoughpw');
    await user.click(screen.getByRole('button', { name: /iniciar sesión|sign in/i }));

    expect(await screen.findByTestId('location')).toHaveTextContent('/');
    expect(signIn).toHaveBeenCalledWith('doc@clinic.test', 'longenoughpw');
  });

  it('calls signUp with matching passwords', async () => {
    signUp.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderForm('signUp');

    await user.type(screen.getByLabelText(/correo electrónico|email/i), 'new@clinic.test');
    await user.type(screen.getByLabelText(/^contraseña$|^password$/i), 'longenoughpw');
    await user.type(screen.getByLabelText(/confirmar contraseña|confirm password/i), 'longenoughpw');
    await user.click(screen.getByRole('button', { name: /crear cuenta|create account/i }));

    expect(await screen.findByTestId('location')).toHaveTextContent('/');
    expect(signUp).toHaveBeenCalledWith('new@clinic.test', 'longenoughpw');
  });

  it('navigates back to the intended location after signIn', async () => {
    signIn.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageProvider>
          <MemoryRouter
            initialEntries={[
              { pathname: '/login', state: { from: { pathname: '/patients/new', search: '' } } },
            ]}
          >
            <Routes>
              <Route path="/login" element={<LoginForm mode="signIn" />} />
              <Route path="*" element={<LocationStub />} />
            </Routes>
          </MemoryRouter>
        </LanguageProvider>
      </I18nextProvider>,
    );

    await user.type(screen.getByLabelText(/correo electrónico|email/i), 'doc@clinic.test');
    await user.type(screen.getByLabelText(/^contraseña$|^password$/i), 'longenoughpw');
    await user.click(screen.getByRole('button', { name: /iniciar sesión|sign in/i }));

    expect(await screen.findByTestId('location')).toHaveTextContent('/patients/new');
  });

  it('shows a translated error message when Supabase rejects sign in', async () => {
    signIn.mockRejectedValue(new Error('Invalid login credentials'));
    const user = userEvent.setup();
    renderForm('signIn');

    await user.type(screen.getByLabelText(/correo electrónico|email/i), 'doc@clinic.test');
    await user.type(screen.getByLabelText(/^contraseña$|^password$/i), 'longenoughpw');
    await user.click(screen.getByRole('button', { name: /iniciar sesión|sign in/i }));

    expect(
      await screen.findByText(/correo o contraseña incorrectos|incorrect email or password/i),
    ).toBeInTheDocument();
  });
});
