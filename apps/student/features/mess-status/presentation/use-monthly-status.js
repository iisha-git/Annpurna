import { useEffect, useState } from 'react';

import { messStatusRepository } from '../data/mess-status-repository';

/**
 * useMonthlyStatus — loads one month and RELOADS whenever the viewed
 * month changes. Notice the dependency array [year, month]: that's how
 * you tell useEffect "re-run when these change".
 */
export function useMonthlyStatus(year, month) {
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    messStatusRepository
      .getMonthlyStatus(year, month)
      .then(({ statuses: data }) => {
        if (alive) {
          setStatuses(data);
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
  }, [year, month]);

  return { loading, statuses, error };
}
