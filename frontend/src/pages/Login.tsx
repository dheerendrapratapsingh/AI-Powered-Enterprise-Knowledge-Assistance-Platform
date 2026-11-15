import React, { useState } from 'react';
import { login, register } from '../services/auth';
import './Login.css';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        await register({
          name,
          email,
          password,
          student_id: studentId || undefined,
          role
        });
      } else {
        await login(email, password);
      }
      onLogin();
    } catch (err: any) {
      setError(err.message || (isSignUp ? 'Registration failed' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setIsSignUp(false);
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
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
          <p className="subtitle">Enterprise Knowledge Assistance Platform</p>
        </div>

        {/* Tab Toggle: Sign In vs Sign Up */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: 12,
          padding: 4,
          marginBottom: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 8,
              border: 'none',
              background: !isSignUp ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
              color: !isSignUp ? '#fff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 8,
              border: 'none',
              background: isSignUp ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
              color: isSignUp ? '#fff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Sign Up
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. Rahul Sharma"
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Registration Number</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={studentId} 
                  onChange={e => setStudentId(e.target.value)} 
                  placeholder="e.g. 22BCE1024"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Role</label>
                <select
                  className="form-input"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="STUDENT" style={{ background: '#1e1b4b', color: '#fff' }}>🎓 Student</option>
                  <option value="ORG_ADMIN" style={{ background: '#1e1b4b', color: '#fff' }}>🏫 Organization Admin</option>
                  <option value="ADMIN" style={{ background: '#1e1b4b', color: '#fff' }}>⚙️ Platform Admin</option>
                </select>
              </div>
            </>
          )}

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
            {loading ? (isSignUp ? 'Creating Account...' : 'Authenticating...') : (isSignUp ? 'Create Student Account' : 'Sign In')}
          </button>
        </form>

        <div className="credentials-hint">
          <p style={{ fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Quick Demo Login (Click to Fill)</p>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => fillDemoAccount('student@vitap.ac.in', 'student123')}
              style={{
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#a5b4fc',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('org@vitap.ac.in', 'org123')}
              style={{
                background: 'rgba(168, 85, 247, 0.2)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                color: '#d8b4fe',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              🏫 Org Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('admin@vitap.ac.in', 'admin123')}
              style={{
                background: 'rgba(236, 72, 153, 0.2)',
                border: '1px solid rgba(236, 72, 153, 0.4)',
                color: '#f472b6',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              ⚙️ Platform Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
