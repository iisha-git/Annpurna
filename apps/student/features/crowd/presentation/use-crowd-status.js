import { useEffect, useState } from 'react';

import * as crowdRepository from '../data/mock-crowd-repository';

/**
 * useCrowdStatus — subscribes the screen to live engine updates.
 *
 * The subscribe/unsubscribe pattern: useEffect returns the cleanup function,
 * so React automatically unsubscribes when the screen unmounts.
 */
export function useCrowdStatus() {
  const [snapshot, setSnapshot] = useState(() => crowdRepository.getSnapshot());

  useEffect(() => {
    const unsubscribe = crowdRepository.subscribe(setSnapshot);
    return unsubscribe;
  }, []);

  return snapshot;
}
