import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSessionHistory } = vi.hoisted(() => ({
  getSessionHistory: vi.fn(),
}));

vi.mock('@/lib/dataAccess', () => ({ getSessionHistory }));

import { SHORT_TOTAL_TURNS, TOTAL_TURNS } from '@/lib/protocol';

import { useOnboarding } from '../useOnboarding';

describe('useOnboarding', () => {
  beforeEach(() => {
    getSessionHistory.mockReset();
  });

  it('uses short mode when the patient has no prior sessions', async () => {
    getSessionHistory.mockResolvedValue([]);
    const { result } = renderHook(() => useOnboarding('patient-1'));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getSessionHistory).toHaveBeenCalledWith('patient-1');
    expect(result.current.shortMode).toBe(true);
    expect(result.current.totalTurns).toBe(SHORT_TOTAL_TURNS);
  });

  it('uses full mode once the patient has at least one prior session', async () => {
    getSessionHistory.mockResolvedValue([
      { id: 's-1', patientId: 'patient-1' } as unknown as never,
    ]);
    const { result } = renderHook(() => useOnboarding('patient-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.shortMode).toBe(false);
    expect(result.current.totalTurns).toBe(TOTAL_TURNS);
  });

  it('does nothing when no patientId is given', async () => {
    const { result } = renderHook(() => useOnboarding(undefined));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getSessionHistory).not.toHaveBeenCalled();
    expect(result.current.shortMode).toBe(false);
  });
});
