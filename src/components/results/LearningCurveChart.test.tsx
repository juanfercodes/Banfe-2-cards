import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { LearningCurveChart } from './LearningCurveChart';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="line-chart">
      {children}
      <pre data-testid="line-chart-data">{JSON.stringify(data)}</pre>
    </div>
  ),
  Line: (props: { isAnimationActive?: boolean }) => (
    <div data-testid="line" data-animation-active={String(props.isAnimationActive)} />
  ),
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ReferenceLine: () => null,
}));

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('<LearningCurveChart />', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders a point per block', () => {
    renderWithProviders(<LearningCurveChart learningCurve={[1, 2, 3]} />);
    const data = JSON.parse(screen.getByTestId('line-chart-data').textContent ?? '[]') as unknown[];
    expect(data).toHaveLength(3);
  });

  it('enables animation by default', () => {
    renderWithProviders(<LearningCurveChart learningCurve={[1, 2, 3]} />);
    expect(screen.getByTestId('line')).toHaveAttribute('data-animation-active', 'true');
  });

  it('disables animation when prefers-reduced-motion is set', () => {
    mockReducedMotion(true);
    renderWithProviders(<LearningCurveChart learningCurve={[1, 2, 3]} />);
    expect(screen.getByTestId('line')).toHaveAttribute('data-animation-active', 'false');
  });

  it('shows the improving trend caption for a rising curve', () => {
    renderWithProviders(<LearningCurveChart learningCurve={[-5, 0, 10]} />);
    expect(screen.getByText('Mejorando')).toBeInTheDocument();
  });
});
