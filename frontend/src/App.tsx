import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { PlatformAdmin } from './pages/PlatformAdmin';
import { EmployeeChat } from './pages/EmployeeChat';
import { OrgAdmin } from './pages/OrgAdmin';
import { LandingPage } from './pages/LandingPage';
import Login from './pages/Login';
import { getCurrentUser } from './services/auth';
import { Loader2 } from 'lucide-react';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

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

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        width: '100vw',
        background: '#080D1B',
        color: '#F8FAFC',
        gap: '14px'
      }}>
        <Loader2 size={32} className="animate-spin" color="var(--accent-cyan)" />
        <span style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Initializing VIT-AP Copilot...
        </span>
      </div>
    );
  }

  // If user is not signed in
  if (!user) {
    if (showAuth) {
      return <Login onLogin={checkAuth} onBackToHome={() => setShowAuth(false)} />;
    }
    return (
      <LandingPage 
        onGetStarted={() => setShowAuth(true)} 
        onSelectPrompt={(_prompt) => {
          setShowAuth(true);
        }} 
      />
    );
  }

  // Authenticated Application Shell
  return (
    <BrowserRouter>
      <Routes>
        {/* Welcome / Landing Route accessible even when logged in */}
        <Route 
          path="/welcome" 
          element={
            <LandingPage 
              onGetStarted={() => {
                const target = user.role === 'ADMIN' ? "/platform" : user.role === 'ORG_ADMIN' ? "/org" : "/chat";
                window.location.href = target;
              }} 
            />
          } 
        />

        {/* Platform Admin Routes */}
        <Route path="/platform" element={<MainLayout role="platform" />}>
          <Route index element={<PlatformAdmin />} />
          <Route path="orgs" element={<PlatformAdmin />} />
          <Route path="settings" element={<PlatformAdmin />} />
        </Route>

        {/* Organization Admin Routes */}
        <Route path="/org" element={<MainLayout role="org" />}>
          <Route index element={<OrgAdmin />} />
          <Route path="knowledge" element={<OrgAdmin />} />
          <Route path="users" element={<OrgAdmin />} />
          <Route path="ai-config" element={<OrgAdmin />} />
        </Route>

        {/* Student / Member Chat Routes */}
        <Route path="/chat" element={<MainLayout role="employee" />}>
          <Route index element={<EmployeeChat />} />
        </Route>
        <Route path="/search" element={<Navigate to="/chat" replace />} />
        
        {/* Redirect root based on user role */}
        <Route 
          path="/" 
          element={
            <Navigate 
              to={user.role === 'ADMIN' ? "/platform" : user.role === 'ORG_ADMIN' ? "/org" : "/chat"} 
              replace 
            />
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
