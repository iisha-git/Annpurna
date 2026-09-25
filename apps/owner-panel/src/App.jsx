import { useEffect, useState } from 'react';

import { api, getToken, setToken } from './api';
import { Avatar, FoodLoader, Icon } from './ui';

import Dashboard from './pages/Dashboard';
import MenuEditor from './MenuEditor';
import StudentDetails from './pages/StudentDetails';
import LeavesEditor from './LeavesEditor';
import WorkerDetails from './pages/WorkerDetails';
import Inventory from './pages/Inventory';
import Reviews from './pages/Reviews';
import Fees from './pages/Fees';

const TABS = [
  { key: 'dashboard', label: 'Overview', icon: 'grid', title: 'Overview', subtitle: 'Everything happening in your mess today' },
  { key: 'menu', label: 'Menu', icon: 'book', title: 'Weekly Menu', subtitle: 'Plan the week — students see it live on their phones' },
  { key: 'students', label: 'Students', icon: 'users', title: 'Student Details', subtitle: 'The full roster with attendance and fee status' },
  { key: 'leaves', label: 'Leave & Roster', icon: 'calendar', title: 'Leave & Roster', subtitle: 'Import the mess list and approve leave days' },
  { key: 'workers', label: 'Staff', icon: 'chef', title: 'Staff', subtitle: 'Kitchen and cleaning staff working at the mess' },
  { key: 'inventory', label: 'Inventory', icon: 'package', title: 'Inventory', subtitle: 'Stock levels for everything in the store' },
  { key: 'reviews', label: 'Reviews', icon: 'star', title: 'Reviews', subtitle: 'What students are saying about the food' },
  { key: 'fees', label: 'Fees', icon: 'rupee', title: 'Fees', subtitle: 'Collections, dues and gentle reminders' },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(() => Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
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
        if (alive) setBooting(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const signOut = () => {
    setToken(null);
    setUser(null);
    setBooting(false);
  };

  /* While the session is verified the whole app frame (sidebar, header) is
     already visible — only the content area shows the loader. */
  if (booting) return <Shell user={null} booting onSignOut={signOut} />;
  if (!user) return <Login onAuthed={setUser} />;

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
    <main className="login-wrap">
      <section className="login-hero">
        <div className="login-brand">
          <span className="brand-mark"><Icon name="wheat" size={22} /></span>
          <div className="login-words">
            <div className="brand-name">Annpurna</div>
            <div className="brand-sub">Mess management</div>
          </div>
        </div>

        <div className="login-hero-copy">
          <h1>Run your mess,<br /><em>effortlessly.</em></h1>
          <p>Menu planning, attendance, stock, reviews and fees — one calm dashboard for the whole mess.</p>
        </div>

        <ul className="login-points">
          <li><span className="pt-ico"><Icon name="check" size={14} /></span> Live menu &amp; crowd feed from students</li>
          <li><span className="pt-ico"><Icon name="check" size={14} /></span> Import the roster with one paste</li>
          <li><span className="pt-ico"><Icon name="check" size={14} /></span> Daily review and stock insights</li>
        </ul>

        <div className="hero-foot">Annpurna · Owner Panel</div>
      </section>

      <section className="login-form">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card-head">
            <h2>Welcome back</h2>
            <p>Sign in to your mess dashboard</p>
          </div>

          <label className="field-group">
            <span>Email address</span>
            <div className="field-ico">
              <Icon name="mail" size={16} />
              <input
                className="field"
                type="email"
                placeholder="owner@annpurna.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </div>
          </label>

          <label className="field-group">
            <span>Password</span>
            <div className="field-ico">
              <Icon name="lock" size={16} />
              <input
                className="field"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </label>

          {error && (
            <div className="form-error"><Icon name="alert" size={15} />{error}</div>
          )}

          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in to dashboard'}
          </button>
        </form>
      </section>
    </main>
  );
}

function Shell({ user, booting = false, onSignOut }) {
  const TAB_KEYS = ['dashboard', 'menu', 'students', 'leaves', 'workers', 'inventory', 'reviews', 'fees'];

  const tabFromLocation = () => {
    const p = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
    if (TAB_KEYS.includes(p)) return p;
    const h = window.location.hash.replace(/^#/, '');
    return TAB_KEYS.includes(h) ? h : 'dashboard';
  };

  const [tab, setTabState] = useState(tabFromLocation);
  const active = TABS.find((t) => t.key === tab);
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  const setTab = (next) => {
    setTabState(next);
    if (window.location.pathname !== `/${next}`) window.history.replaceState(null, '', `/${next}`);
  };

  /* Let the URL drive the tab, so /leaves (or #leaves) and back/forward work. */
  useEffect(() => {
    const onNav = () => {
      const h = window.location.hash.replace(/^#/, '');
      const p = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
      const next = TAB_KEYS.includes(h) ? h : (TAB_KEYS.includes(p) ? p : null);
      if (next && next !== tab) setTabState(next);
    };
    window.addEventListener('hashchange', onNav);
    window.addEventListener('popstate', onNav);
    return () => {
      window.removeEventListener('hashchange', onNav);
      window.removeEventListener('popstate', onNav);
    };
  }, [tab]);

  function renderPage() {
    if (booting) {
      return (
        <div className="page-load" aria-live="polite">
          <FoodLoader />
          <p>Waking up the mess server…</p>
        </div>
      );
    }
    switch (tab) {
      case 'dashboard': return <Dashboard onNavigate={setTab} />;
      case 'menu': return <MenuEditor />;
      case 'students': return <StudentDetails />;
      case 'leaves': return <LeavesEditor />;
      case 'workers': return <WorkerDetails />;
      case 'inventory': return <Inventory />;
      case 'reviews': return <Reviews />;
      case 'fees': return <Fees />;
      default: return null;
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><Icon name="wheat" size={20} /></span>
          <div className="brand-text">
            <div className="brand-name">Annpurna</div>
            <div className="brand-sub">Mess Admin</div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-label">Manage</div>
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`nav-item ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <Icon name={t.icon} size={18} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span className="user-tile">
            <Avatar name={user.email || 'O'} size={36} />
            <span>
              <span className="user-name">{user.email || 'Owner'}</span>
              <br />
              <span className="crown">Owner</span>
            </span>
          </span>
          <button className="signout" title="Sign out" onClick={onSignOut}>
            <Icon name="logout" size={17} />
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="page-title">
            <h1>{active.title}</h1>
            <p>{active.subtitle}</p>
          </div>
          <div className="topbar-r">
            <span className="date-chip"><Icon name="calendar" size={15} />{today}</span>
            <button className="bell" title="Notifications"><Icon name="bell" size={17} /><i className="dot" /></button>
          </div>
        </header>

        <div className="content-scroll">
          <div className="page">{renderPage()}</div>
        </div>
      </main>
    </div>
  );
}