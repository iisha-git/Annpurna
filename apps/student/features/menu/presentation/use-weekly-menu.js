import { useEffect, useState } from 'react';

import { menuRepository } from '../data/menu-repository';

/**
 * useWeeklyMenu — subscribes to the LIVE weekly menu.
 *
 * The first snapshot arrives right away; after that, any owner edit in the
 * panel re-fires automatically and `week` updates — no reload needed.
 */
export function useWeeklyMenu() {
  const [week, setWeek] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    const unsubscribe = menuRepository.subscribeToWeeklyMenu(
      (data) => {
        if (!alive) return;
        setWeek(data);
        setError(null);
      },
      (err) => {
        if (!alive) return;
        setError(err);
      }
    );

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  // Loading only until the very first data arrives
  return { loading: week === null && !error, week, error };
}
