import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import StudentHome from './pages/StudentHome';
import Chat from './pages/Chat';
import AdminDashboard from './pages/AdminDashboard';
import { getCurrentUser, logout } from './services/auth';
import './index.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'chat'>('home');
  const [initialQuestion, setInitialQuestion] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = (q?: string) => {
    if (q) setInitialQuestion(q);
    setCurrentView('chat');
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f7fa', fontFamily: 'Inter, sans-serif' }}>Loading...</div>;

  if (!user) {
    return <Login onLogin={checkAuth} />;
  }

  if (user.role === 'ADMIN') {
    return (
      <div style={{ height: '100vh', background: '#f5f7fa', margin: 0, padding: 0 }}>
        <AdminDashboard onLogout={() => { logout(); setUser(null); }} />
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', background: '#f5f7fa', margin: 0, padding: 0 }}>
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}>
        <button onClick={() => { logout(); setUser(null); }} style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #cbd5e0', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500, color: '#4a5568' }}>
          Logout
        </button>
      </div>
      
      {currentView === 'home' && <StudentHome onStartChat={handleStartChat} />}
      {currentView === 'chat' && <Chat initialQuestion={initialQuestion} onBack={() => { setCurrentView('home'); setInitialQuestion(''); }} />}
    </div>
  );
}

export default App;
