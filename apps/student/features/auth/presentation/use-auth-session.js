import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '@/shared/lib/firebase';

/**
 * AUTH SESSION — one listener for the whole app.
 *
 * AuthProvider sits at the root and listens to Firebase's session state;
 * any component calls useAuthSession() to know { user, loading }.
 * Firebase persists nothing between app restarts yet, so users sign in
 * once per launch until we add storage persistence.
 */

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, loading: true });

  useEffect(() => {
    // Fires immediately with current state, then on every sign-in/out
    return onAuthStateChanged(auth, (user) => setState({ user, loading: false }));
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuthSession() {
  return useContext(AuthContext);
}
