import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { PlatformAdmin } from './pages/PlatformAdmin';
import { EmployeeChat } from './pages/EmployeeChat';
import { OrgAdmin } from './pages/OrgAdmin';
import Login from './pages/Login';
import { getCurrentUser } from './services/auth';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff' }}>Loading platform...</div>;

  if (!user) {
    return <Login onLogin={checkAuth} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Platform Admin Routes */}
        <Route path="/platform" element={<MainLayout role="platform" />}>
          <Route index element={<PlatformAdmin />} />
          <Route path="orgs" element={<div>Organizations (Coming Soon)</div>} />
          <Route path="settings" element={<div>Settings (Coming Soon)</div>} />
        </Route>

        {/* Organization Admin Routes */}
        <Route path="/org" element={<MainLayout role="org" />}>
          <Route index element={<OrgAdmin />} />
          <Route path="knowledge" element={<OrgAdmin />} />
          <Route path="users" element={<div>Users & Roles (Coming Soon)</div>} />
          <Route path="ai-config" element={<div>AI Configuration (Coming Soon)</div>} />
        </Route>

        {/* Employee / Student Routes */}
        <Route path="/chat" element={<MainLayout role="employee" />}>
          <Route index element={<EmployeeChat />} />
        </Route>
        <Route path="/search" element={<Navigate to="/chat" replace />} />
        
        {/* Redirect root based on role */}
        <Route path="/" element={<Navigate to={user.role === 'ADMIN' ? "/platform" : user.role === 'ORG_ADMIN' ? "/org" : "/chat"} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
