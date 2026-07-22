import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTranslation } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { Layout } from './Layout';
import { renderWithProviders } from '../../test/render';

function LocaleLabel() {
  const { t } = useTranslation();
  return <div data-testid="locale-label">{t('route.placeholder')}</div>;
}

describe('<Layout />', () => {
  it('renders nav, language switcher, children and sign out', () => {
    renderWithProviders(
      <Layout>
        <LocaleLabel />
      </Layout>,
      { route: '/' },
    );

    expect(screen.getByRole('link', { name: /Banfe-2-cards/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Cambiar a inglés|Switch to Spanish/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cerrar sesión|Sign out/i })).toBeInTheDocument();
    expect(screen.getByTestId('locale-label')).toHaveTextContent('Página en construcción');
  });

  it('toggles locale when language switcher is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Layout>
        <LocaleLabel />
      </Layout>,
      { route: '/' },
    );

    const switcher = screen.getByRole('button', { name: /Cambiar a inglés|Switch to Spanish/i });
    expect(screen.getByTestId('locale-label')).toHaveTextContent('Página en construcción');

    await user.click(switcher);

    expect(screen.getByTestId('locale-label')).toHaveTextContent('Page under construction');
  });
});
