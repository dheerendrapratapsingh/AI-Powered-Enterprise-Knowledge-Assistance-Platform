import React, { useState } from 'react';
import { login, register } from '../services/auth';
import './Login.css';

type RoleType = 'STUDENT' | 'ORG_ADMIN' | 'ADMIN';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleType>('STUDENT');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: RoleType) => {
    setSelectedRole(role);
    setError('');
    // Auto-adjust demo placeholder hint or reset fields
    if (role === 'STUDENT' && !email.includes('@')) {
      setEmail('');
    }
  };

  const fillDemoAccount = (demoRole: RoleType, demoEmail: string, demoPass: string) => {
    setSelectedRole(demoRole);
    setIsSignUp(false);
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Please enter your full name');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        await register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: selectedRole,
          student_id: selectedRole === 'STUDENT' ? studentId.trim() : undefined
        });

        setSuccess('Account created successfully! Logging you in...');
        setTimeout(() => {
          onLogin();
        }, 800);
      } else {
        await login(email.trim().toLowerCase(), password);
        onLogin();
      }
    } catch (err: any) {
      setError(err.message || (isSignUp ? 'Failed to create account' : 'Failed to login'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-card">
        {/* Branding Header */}
        <div className="logo-container">
          <div className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2 className="title">VIT-AP Copilot</h2>
          <p className="subtitle">Enterprise Knowledge Assistance Platform</p>
        </div>

        {/* Role Portal Selection Tabs */}
        <div className="role-selector">
          <button 
            type="button"
            className={`role-tab ${selectedRole === 'STUDENT' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('STUDENT')}
          >
            <span className="role-icon">🎓</span>
            <span className="role-text">Student</span>
          </button>
          <button 
            type="button"
            className={`role-tab ${selectedRole === 'ORG_ADMIN' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('ORG_ADMIN')}
          >
            <span className="role-icon">🏫</span>
            <span className="role-text">Org Admin</span>
          </button>
          <button 
            type="button"
            className={`role-tab ${selectedRole === 'ADMIN' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('ADMIN')}
          >
            <span className="role-icon">⚙️</span>
            <span className="role-text">Platform Admin</span>
          </button>
        </div>

        {/* Sign In vs Sign Up Toggle */}
        <div className="auth-mode-toggle">
          <button 
            type="button"
            className={`mode-btn ${!isSignUp ? 'active' : ''}`}
            onClick={() => { setIsSignUp(false); setError(''); }}
          >
            Sign In
          </button>
          <button 
            type="button"
            className={`mode-btn ${isSignUp ? 'active' : ''}`}
            onClick={() => { setIsSignUp(true); setError(''); }}
          >
            Create Account
          </button>
        </div>

        {/* Status Alerts */}
        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        {/* Authentication Form */}
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
                  placeholder="e.g. Narasimha Reddy"
                  required 
                />
              </div>

              {selectedRole === 'STUDENT' && (
                <div className="form-group">
                  <label className="form-label">Registration / Student ID</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={studentId} 
                    onChange={e => setStudentId(e.target.value)} 
                    placeholder="e.g. 22BCE7045"
                  />
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label className="form-label">
              {selectedRole === 'STUDENT' ? 'Student Email' : 'Institutional Email'}
            </label>
            <input 
              type="email" 
              className="form-input"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder={selectedRole === 'STUDENT' ? 'name.reg@vitapstudent.ac.in' : 'admin@vitap.ac.in'}
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

          {isSignUp && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input 
                type="password" 
                className="form-input"
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="••••••••"
                required 
              />
            </div>
          )}
          
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (isSignUp ? 'Creating Account...' : 'Authenticating...') : (isSignUp ? `Register as ${selectedRole === 'STUDENT' ? 'Student' : selectedRole === 'ORG_ADMIN' ? 'Org Admin' : 'Admin'}` : 'Sign In')}
          </button>
        </form>

        {/* Demo Credentials Quick-Select */}
        <div className="credentials-hint">
          <p><strong>Quick Demo Access (Click to Fill):</strong></p>
          <div className="demo-accounts-grid">
            <button 
              type="button" 
              className="demo-pill"
              onClick={() => fillDemoAccount('STUDENT', 'student@vitap.ac.in', 'student123')}
            >
              🎓 Student Demo
            </button>
            <button 
              type="button" 
              className="demo-pill"
              onClick={() => fillDemoAccount('ORG_ADMIN', 'org@vitap.ac.in', 'org123')}
            >
              🏫 Org Admin Demo
            </button>
            <button 
              type="button" 
              className="demo-pill"
              onClick={() => fillDemoAccount('ADMIN', 'admin@vitap.ac.in', 'admin123')}
            >
              ⚙️ Platform Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
