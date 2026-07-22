import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ScoreSummary } from '@/lib/scoring';
import i18n from '@/i18n/index';
import { renderWithProviders } from '@/test/render';

import { InterpretationHint } from './InterpretationHint';

function baseSummary(overrides: Partial<ScoreSummary> = {}): ScoreSummary {
  return {
    totalNet: 0,
    perStack: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    penalizations: 0,
    advantageDisadvantageIndex: 0,
    drawsPerStack: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    ...overrides,
  };
}

describe('<InterpretationHint />', () => {
  it('renders the clinical disclaimer', () => {
    renderWithProviders(<InterpretationHint summary={baseSummary()} events={[]} />);
    expect(screen.getByText(/no constituye un diagnóstico clínico/i)).toBeInTheDocument();
  });

  it('switches the text by tendency', () => {
    const { rerender } = renderWithProviders(
      <InterpretationHint summary={baseSummary({ advantageDisadvantageIndex: 10 })} events={[]} />,
    );
    expect(screen.getByText(/ventajosos/i)).toBeInTheDocument();

    rerender(
      <InterpretationHint summary={baseSummary({ advantageDisadvantageIndex: -10 })} events={[]} />,
    );
    expect(screen.getByText(/desventajosos/i)).toBeInTheDocument();
  });

  it('renders English text when the language is English', async () => {
    await i18n.changeLanguage('en');
    renderWithProviders(
      <InterpretationHint summary={baseSummary({ advantageDisadvantageIndex: 10 })} events={[]} />,
    );
    expect(screen.getByText(/does not constitute a clinical diagnosis/i)).toBeInTheDocument();
    await i18n.changeLanguage('es');
  });
});
