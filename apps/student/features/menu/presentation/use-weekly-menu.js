import { useEffect, useState } from 'react';

import { menuRepository } from '../data/menu-repository';

/**
 * useWeeklyMenu — a custom hook: reusable state+effect logic for components.
 *
 * Loads the weekly menu once, exposes { loading, week, error }.
 * The `alive` flag prevents state updates after the screen unmounts
 * (avoids React "state update on unmounted component" warnings).
 */
export function useWeeklyMenu() {
  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    menuRepository
      .getWeeklyMenu()
      .then((data) => {
        if (alive) {
          setWeek(data);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (alive) {
          setError(e);
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, []);

  return { loading, week, error };
}
