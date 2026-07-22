/* eslint-disable react-refresh/only-export-components */

import { render, type RenderOptions } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { AuthProvider } from '../components/auth/AuthProvider';
import { LanguageProvider } from '../i18n/LanguageProvider';
import i18n from '../i18n/index';

export interface WrapperOptions {
  route?: string | undefined;
  withRouter?: boolean | undefined;
}

export function AllProviders({
  children,
  route = '/',
  withRouter = true,
}: {
  children: React.ReactNode;
  route?: string | undefined;
  withRouter?: boolean | undefined;
}) {
  const inner = (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <AuthProvider>{children}</AuthProvider>
      </LanguageProvider>
    </I18nextProvider>
  );

  if (!withRouter) {
    return inner;
  }

  return <MemoryRouter initialEntries={[route]}>{inner}</MemoryRouter>;
}

export function renderWithProviders(ui: React.ReactNode, options: RenderOptions & WrapperOptions = {}) {
  const { route, withRouter, ...renderOptions } = options;
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders route={route} withRouter={withRouter}>
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  });
}
