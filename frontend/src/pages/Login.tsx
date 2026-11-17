import React, { useState } from 'react';
import { Bot, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { login, register, getCurrentUser } from '../services/auth';
import './Login.css';

type RoleType = 'STUDENT' | 'ORG_ADMIN' | 'ADMIN';

interface LoginProps {
  onLogin: (user?: any) => void;
  onBackToHome?: () => void;
}

export default function Login({ onLogin, onBackToHome }: LoginProps) {
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
    setSuccess('');
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
        let userData: any = null;
        try {
          userData = await getCurrentUser();
        } catch {}
        setTimeout(() => {
          onLogin(userData);
        }, 600);
      } else {
        await login(email.trim().toLowerCase(), password);
        let userData: any = null;
        try {
          userData = await getCurrentUser();
        } catch {}
        onLogin(userData);
      }
    } catch (err: any) {
      setError(err.message || (isSignUp ? 'Failed to create account' : 'Failed to login'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {onBackToHome && (
        <button className="back-home-btn" onClick={onBackToHome}>
          <ArrowLeft size={16} /> Back to Overview
        </button>
      )}

      <div className="glass-card-auth">
        {/* Branding Header */}
        <div className="logo-container">
          <div className="logo-icon-auth">
            <Bot size={26} color="#FFFFFF" />
          </div>
          <h2 className="title-auth">VIT-AP AI Copilot</h2>
          <p className="subtitle-auth">Enterprise Campus Knowledge Assistance Platform</p>
        </div>

        {/* Role Portal Selection Tabs */}
        <div className="role-selector">
          <button 
            type="button"
            className={`role-tab ${selectedRole === 'STUDENT' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('STUDENT')}
          >
            <span>🎓</span>
            <span>Student</span>
          </button>
          <button 
            type="button"
            className={`role-tab ${selectedRole === 'ORG_ADMIN' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('ORG_ADMIN')}
          >
            <span>🏫</span>
            <span>Org Admin</span>
          </button>
          <button 
            type="button"
            className={`role-tab ${selectedRole === 'ADMIN' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('ADMIN')}
          >
            <span>⚙️</span>
            <span>Platform</span>
          </button>
        </div>

        {/* Sign In vs Sign Up Toggle */}
        <div className="auth-mode-toggle">
          <button 
            type="button"
            className={`mode-btn ${!isSignUp ? 'active' : ''}`}
            onClick={() => { setIsSignUp(false); setError(''); setSuccess(''); }}
          >
            Sign In
          </button>
          <button 
            type="button"
            className={`mode-btn ${isSignUp ? 'active' : ''}`}
            onClick={() => { setIsSignUp(true); setError(''); setSuccess(''); }}
          >
            Create Account
          </button>
        </div>

        {/* Status Alerts */}
        {error && <div className="error-banner-auth">{error}</div>}
        {success && <div className="success-banner-auth">{success}</div>}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <>
              <div className="form-group-auth">
                <label className="form-label-auth">Full Name</label>
                <input 
                  type="text" 
                  className="form-input-auth"
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. Rahul Sharma"
                  required 
                />
              </div>

              {selectedRole === 'STUDENT' && (
                <div className="form-group-auth">
                  <label className="form-label-auth">Registration Number (Student ID)</label>
                  <input 
                    type="text" 
                    className="form-input-auth"
                    value={studentId} 
                    onChange={e => setStudentId(e.target.value)} 
                    placeholder="e.g. 22BCE1024"
                  />
                </div>
              )}
            </>
          )}

          <div className="form-group-auth">
            <label className="form-label-auth">
              {selectedRole === 'STUDENT' ? 'Student Email' : 'Institutional Email'}
            </label>
            <input 
              type="email" 
              className="form-input-auth"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder={selectedRole === 'STUDENT' ? 'name.reg@vitapstudent.ac.in' : 'admin@vitap.ac.in'}
              required 
            />
          </div>
          
          <div className="form-group-auth">
            <label className="form-label-auth">Password</label>
            <input 
              type="password" 
              className="form-input-auth"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </div>

          {isSignUp && (
            <div className="form-group-auth">
              <label className="form-label-auth">Confirm Password</label>
              <input 
                type="password" 
                className="form-input-auth"
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="••••••••"
                required 
              />
            </div>
          )}
          
          <button type="submit" className="submit-btn-auth" disabled={loading}>
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Loader2 size={16} className="animate-spin" />
                {isSignUp ? 'Creating Account...' : 'Authenticating...'}
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} />
                {isSignUp ? `Register as ${selectedRole === 'STUDENT' ? 'Student' : selectedRole === 'ORG_ADMIN' ? 'Org Admin' : 'Admin'}` : 'Sign In'}
              </span>
            )}
          </button>
        </form>

        {/* Demo Credentials Quick-Select */}
        <div className="credentials-hint-auth">
          <div className="credentials-label">Instant Demo Evaluation</div>
          <div className="demo-accounts-grid-auth">
            <button 
              type="button" 
              className="demo-pill-auth"
              onClick={() => fillDemoAccount('STUDENT', 'student@vitap.ac.in', 'student123')}
            >
              🎓 Student
            </button>
            <button 
              type="button" 
              className="demo-pill-auth"
              onClick={() => fillDemoAccount('ORG_ADMIN', 'org@vitap.ac.in', 'org123')}
            >
              🏫 Org Admin
            </button>
            <button 
              type="button" 
              className="demo-pill-auth"
              onClick={() => fillDemoAccount('ADMIN', 'admin@vitap.ac.in', 'admin123')}
            >
              ⚙️ Platform
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
