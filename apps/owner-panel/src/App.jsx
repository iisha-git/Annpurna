import { useEffect, useState } from 'react';

import { api, setToken } from './api';
import LeavesEditor from './LeavesEditor';
import MenuEditor from './MenuEditor';

// New Pages
import Dashboard from './pages/Dashboard';
import StudentDetails from './pages/StudentDetails';
import WorkerDetails from './pages/WorkerDetails';
import Inventory from './pages/Inventory';
import Reviews from './pages/Reviews';
import Fees from './pages/Fees';

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .get('/auth/me')
      .then(({ user: u }) => {
        if (alive) setUser(u);
      })
      .catch(() => {
        if (alive) setToken(null);
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
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') {
        const { token, user } = await api.post('/auth/login', {
          identifier: email.trim(),
          password,
        });
        setToken(token);
        onAuthed(user);
      } else {
        const res = await api.post('/auth/owner/reset-password', {
          email: email.trim(),
          secretKey: secretKey.trim(),
          newPassword,
        });
        setToken(res.token);
        onAuthed(res.user);
      }
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="center">
      <form className="loginCard" onSubmit={handleSubmit}>
        <h1>Annpurna</h1>
        <p className="muted">
          {mode === 'login' ? 'Mess owner panel' : 'Reset owner password'}
        </p>
        <input
          type="email"
          placeholder="Owner email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
        {mode === 'login' ? (
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        ) : (
          <>
            <input
              type="password"
              placeholder="Recovery Secret Key (JWT_SECRET)"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="New Password (min 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </>
        )}

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={busy}>
          {busy
            ? mode === 'login'
              ? 'Signing in…'
              : 'Resetting…'
            : mode === 'login'
            ? 'Sign in'
            : 'Reset & Sign in'}
        </button>

        <div style={{ marginTop: '8px' }}>
          {mode === 'login' ? (
            <button
              type="button"
              className="ghost"
              style={{ fontSize: '13px', color: 'var(--amber-pressed)', textDecoration: 'underline' }}
              onClick={() => {
                setMode('forgot');
                setError('');
              }}>
              Forgot password?
            </button>
          ) : (
            <button
              type="button"
              className="ghost"
              style={{ fontSize: '13px', color: 'var(--muted)' }}
              onClick={() => {
                setMode('login');
                setError('');
              }}>
              ← Back to Sign in
            </button>
          )}
        </div>
      </form>
    </main>
  );
}

const TABS = [
  ['dashboard', 'Dashboard'],
  ['students', 'Student Details'],
  ['workers', 'Worker Details'],
  ['inventory', 'Inventory'],
  ['reviews', 'Reviews'],
  ['fees', 'Fees'],
  ['leaves', 'Approved Leaves']
];

function Shell({ user, onSignOut }) {
  const [tab, setTab] = useState('dashboard');
  const [showMenu, setShowMenu] = useState(false);
  const [stats, setStats] = useState({ total: 418, present: 418, onLeave: 0, absent: 0 });
  const [pendingFees, setPendingFees] = useState(0);

  useEffect(() => {
    let alive = true;
    const loadStats = () => {
      api.get('/students/attendance-summary')
        .then((data) => {
          if (alive && data) setStats(data);
        })
        .catch(() => {});

      api.get('/fees')
        .then((data) => {
          if (alive && data?.stats) {
            setPendingFees(data.stats.totalPending || 0);
          }
        })
        .catch(() => {});
    };
    loadStats();
    const timer = setInterval(loadStats, 10000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">Annpurna</div>
        <nav className="sidebar-nav">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              className={`sidebar-btn ${tab === key && !showMenu ? 'active' : ''}`}
              onClick={() => {
                setTab(key);
                setShowMenu(false);
              }}>
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="user-info">{user.email}</span>
          <button className="ghost" onClick={onSignOut}>Sign out</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="topbar">
          {tab === 'dashboard' && !showMenu && (
            <div className="summary-cards" style={{ flex: 1, marginBottom: 0, marginRight: '32px' }}>
              <div className="summary-card">
                <div className="summary-label">Total Students</div>
                <div className="summary-value">{stats.total}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Present Today</div>
                <div className="summary-value" style={{ color: 'var(--success)' }}>{stats.present}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">On Leave Today</div>
                <div className="summary-value" style={{ color: 'var(--amber-pressed)' }}>{stats.onLeave}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Pending Fees</div>
                <div className="summary-value" style={{ color: 'var(--amber-pressed)' }}>₹{pendingFees.toLocaleString('en-IN')}</div>
              </div>
            </div>
          )}
          <button 
            className="menu-btn" 
            onClick={() => setShowMenu(true)}>
            Menu
          </button>
        </div>

        <div className="content-scroll">
          {showMenu ? (
            <MenuEditor />
          ) : (
            <>
              {tab === 'dashboard' && <Dashboard stats={stats} onNavigate={setTab} />}
              {tab === 'students' && <StudentDetails />}
              {tab === 'workers' && <WorkerDetails />}
              {tab === 'inventory' && <Inventory />}
              {tab === 'reviews' && <Reviews />}
              {tab === 'fees' && <Fees />}
              {tab === 'leaves' && <LeavesEditor />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}