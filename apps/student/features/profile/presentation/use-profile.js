import { useEffect, useState } from 'react';

import { profileRepository } from '../data/profile-repository';

/** Loads the signed-in student once. Same pattern as useWeeklyMenu. */
export function useProfile() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    profileRepository
      .getCurrentStudent()
      .then((data) => {
        if (alive) {
          setStudent(data);
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

  return { loading, student, error };
}
