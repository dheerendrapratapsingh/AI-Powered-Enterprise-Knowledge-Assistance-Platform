import React, { useState } from 'react';
import { login } from '../services/auth';
import './Login.css';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-card">
        <div className="logo-container">
          <div className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2 className="title">VIT-AP Copilot</h2>
          <p className="subtitle">Enterprise Knowledge Assistance</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="name@vitap.ac.in"
              required 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </div>
          
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="credentials-hint">
          <p><strong>Demo Accounts</strong></p>
          <p>Platform Admin: <span>admin@vitap.ac.in</span> / <span>admin123</span></p>
          <p>Org Admin: <span>org@vitap.ac.in</span> / <span>org123</span></p>
          <p>Student: <span>student@vitap.ac.in</span> / <span>student123</span></p>
        </div>
      </div>
    </div>
  );
}
