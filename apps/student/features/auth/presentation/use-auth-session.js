import { createContext, useContext, useEffect, useState } from 'react';

import { api, clearToken, loadSession, setToken } from '@/shared/lib/api';

/**
 * AUTH SESSION — the whole app's source of truth for "who is signed in?"
 *
 * AuthProvider sits at the root. On launch it restores the persisted JWT
 * from disk and validates it against /auth/me. signIn / signUp / signOut
 * are exposed so screens never touch the API client directly.
 */

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    loadSession()
      .then(() => api.get('/auth/me'))
      .then(({ user: u }) => {
        if (alive) setUser(u);
      })
      .catch(() => {
        if (alive) {
          clearToken(); // expired / invalid session
          setUser(null);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  /** Identifier = mess number (owner accounts never appear in this app). */
  async function signIn(identifier, password) {
    const { token, user: u } = await api.post('/auth/login', { identifier, password });
    await setToken(token);
    setUser(u);
  }

  async function signUp(payload) {
    const { token, user: u } = await api.post('/auth/signup', payload);
    await setToken(token);
    setUser(u);
  }

  async function resetPassword({ messNumber, mobile, newPassword }) {
    const { token, user: u } = await api.post('/auth/reset-password', {
      messNumber,
      mobile,
      newPassword,
    });
    await setToken(token);
    setUser(u);
  }

  async function signOut() {
    await clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthSession() {
  return useContext(AuthContext);
}