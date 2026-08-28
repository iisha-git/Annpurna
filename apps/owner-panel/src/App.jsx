import { useEffect, useState } from 'react';

import { api, setToken } from './api';
import LeavesEditor from './LeavesEditor';
import MenuEditor from './MenuEditor';

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Session restore — if a token exists, validate it against /auth/me
  useEffect(() => {
    let alive = true;
    api
      .get('/auth/me')
      .then(({ user: u }) => {
        if (alive) setUser(u);
      })
      .catch(() => {
        if (alive) setToken(null); // expired / invalid → drop session
      })
      .finally(() => {
        if (alive) setAuthReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!authReady) return <p className="center muted">Connecting to Annpurna…</p>;
  if (!user) return <Login onAuthed={setUser} />;

  async function signOut() {
    setToken(null);
    setUser(null);
  }

  return <Shell user={user} onSignOut={signOut} />;
}

function Login({ onAuthed }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { token, user } = await api.post('/auth/login', {
        identifier: email.trim(),
        password,
      });
      setToken(token);
      onAuthed(user);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="center">
      <form className="loginCard" onSubmit={handleSubmit}>
        <h1>Annpurna</h1>
        <p className="muted">Mess owner panel</p>
        <input
          type="email"
          placeholder="Owner email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}

const TABS = [
  ['menu', "Week's Menu"],
  ['leaves', 'Approved Leaves'],
  ['override', 'Crowd Override'],
];

function Shell({ user, onSignOut }) {
  const [tab, setTab] = useState('menu');

  return (
    <>
      <header className="topbar">
        <span className="brand">Annpurna · Owner</span>
        <span className="spacer" />
        <span className="muted">{user.email}</span>
        <button className="ghost" onClick={onSignOut}>Sign out</button>
      </header>

      <nav className="tabs">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? 'active' : ''}
            onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      <main className="content">
        {tab === 'menu' && <MenuEditor />}
        {tab === 'leaves' && <LeavesEditor />}
        {tab === 'override' && <Placeholder title="Crowd override" note="One-tap 'it's packed' override." />}
      </main>
    </>
  );
}

function Placeholder({ title, note }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <p className="muted">{note}</p>
    </section>
  );
}