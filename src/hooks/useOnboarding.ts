import { useEffect, useState } from 'react';

import { getSessionHistory } from '@/lib/dataAccess';
import { firstSessionHint, shouldUseShortMode } from '@/lib/onboarding';
import { TOTAL_TURNS } from '@/lib/protocol';

export interface UseOnboardingResult {
  loading: boolean;
  shortMode: boolean;
  totalTurns: number;
}

interface OnboardingResolution {
  patientId: string;
  shortMode: boolean;
  totalTurns: number;
}

export function useOnboarding(patientId: string | undefined): UseOnboardingResult {
  const [resolution, setResolution] = useState<OnboardingResolution | null>(null);

  useEffect(() => {
    if (!patientId) return;

    let active = true;
    void getSessionHistory(patientId).then((history) => {
      if (!active) return;
      const short = shouldUseShortMode(history.length);
      setResolution({
        patientId,
        shortMode: short,
        totalTurns: short ? firstSessionHint().totalTurns : TOTAL_TURNS,
      });
    });

    return () => {
      active = false;
    };
  }, [patientId]);

  const resolved = resolution?.patientId === patientId ? resolution : null;

  return {
    loading: patientId != null && resolved === null,
    shortMode: resolved?.shortMode ?? false,
    totalTurns: resolved?.totalTurns ?? TOTAL_TURNS,
  };
}
