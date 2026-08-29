import { useEffect, useMemo, useState } from 'react';

import * as crowdRepository from '../../crowd/data/crowd-repository';
import { computeCurrentStreak, hasCheckedInToday } from '../domain/streak-model';

/**
 * Bridges the crowd repository (single source of check-in days)
 * into streak state for UI components.
 */
export function useStreak() {
  const [snap, setSnap] = useState(crowdRepository.getSnapshot);

  useEffect(() => crowdRepository.subscribe(setSnap), []);

  return useMemo(
    () => ({
      streak: computeCurrentStreak(snap.checkInDates),
      checkedInToday: hasCheckedInToday(snap.checkInDates),
    }),
    [snap],
  );
}
