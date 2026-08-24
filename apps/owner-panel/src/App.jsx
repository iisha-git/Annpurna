import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

import { auth } from './firebase';
import MenuEditor from './MenuEditor';

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Session listener — fires once immediately, then on every login/logout
  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    setAuthReady(true);
  }), []);

  if (!authReady) return <p className="center muted">Connecting to Annpurna…</p>;
  if (!user) return <Login />;
  return <Shell user={user} />;
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // onAuthStateChanged takes it from here
    } catch (err) {
      setError(err.code === 'auth/invalid-credential'
        ? 'Wrong email or password.'
        : `Sign-in failed (${err.code}).`);
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

function Shell({ user }) {
  const [tab, setTab] = useState('menu');

  return (
    <>
      <header className="topbar">
        <span className="brand">Annpurna · Owner</span>
        <span className="spacer" />
        <span className="muted">{user.email}</span>
        <button className="ghost" onClick={() => signOut(auth)}>Sign out</button>
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
        {tab === 'leaves' && <Placeholder title="Approved leaves" note="Mark student leave days per date." />}
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
