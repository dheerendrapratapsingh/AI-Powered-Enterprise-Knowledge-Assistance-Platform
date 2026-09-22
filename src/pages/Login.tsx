import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

const DEMO_ACCOUNTS = [
  { label: 'Platform Admin', email: 'sriram@nexaai.com', password: 'admin123', tag: 'Platform' },
  { label: 'Org Admin — Acme', email: 'himanvi@acmecorp.com', password: 'admin123', tag: 'Org Admin' },
  { label: 'Employee — Acme', email: 'dheerendra@acmecorp.com', password: 'user123', tag: 'Employee' },
];

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectAfterLogin = (role: string) => {
    if (from && from !== '/login') {
      navigate(from, { replace: true });
      return;
    }
    if (role === 'platform_admin') navigate('/platform', { replace: true });
    else if (role === 'org_admin') navigate('/org', { replace: true });
    else navigate('/chat', { replace: true });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'Login failed.');
      return;
    }
    // Read role from localStorage since state update is async
    const stored = localStorage.getItem('nexaai_user');
    const user = stored ? JSON.parse(stored) : null;
    redirectAfterLogin(user?.role ?? 'employee');
  };

  const fillDemo = (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className={styles.page}>
      {/* Ambient background orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoRow}>
          <div className={styles.logoIcon} />
          <span className={`gradient-text ${styles.logoText}`}>NexaAI</span>
        </div>

        <h1 className={styles.heading}>Welcome back</h1>
        <p className={styles.subheading}>Sign in to your enterprise AI workspace</p>

        {/* Demo accounts */}
        <div className={styles.demoRow}>
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              className={styles.demoBtn}
              onClick={() => fillDemo(acc)}
            >
              <span className={styles.demoTag}>{acc.tag}</span>
              <span className={styles.demoLabel}>{acc.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.divider}>
          <span>or enter credentials</span>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className={styles.input}
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <button
            id="login-submit"
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              'Sign in →'
            )}
          </button>
        </form>

        <p className={styles.footer}>
          NexaAI — AI-Powered Enterprise Knowledge Platform
        </p>
      </div>
    </div>
  );
}
