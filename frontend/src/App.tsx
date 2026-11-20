import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { PlatformAdmin } from './pages/PlatformAdmin';
import { PlatformOrgs } from './pages/PlatformOrgs';
import { EmployeeChat } from './pages/EmployeeChat';
import { OrgAdmin } from './pages/OrgAdmin';
import { DocumentBase } from './pages/DocumentBase';
import { HomePage } from './pages/HomePage';
import { ForStudentsPage } from './pages/ForStudentsPage';
import { HowToUsePage } from './pages/HowToUsePage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import Login from './pages/Login';
import { getCurrentUser } from './services/auth';
import { Loader2 } from 'lucide-react';

interface RouteHandlerProps {
  user: any;
  checkAuth: () => Promise<any>;
}

export function getRedirectPathForUser(u: any): string {
  if (!u) return '/login';
  const role = (u.role || '').toUpperCase();
  if (role === 'ADMIN') {
    return '/admin/platform';
  }
  if (role === 'ORG_ADMIN') {
    return '/org';
  }
  return '/copilot';
}

// Unified Chat / Copilot Route Handler - Opens the chat for any authenticated user
function CopilotRouteHandler({ user, checkAuth }: RouteHandlerProps) {
  const navigate = useNavigate();

  if (!user) {
    return (
      <Login
        onLogin={async (userData) => {
          const u = await checkAuth();
          navigate(getRedirectPathForUser(u || userData), { replace: true });
        }}
        onBackToHome={() => navigate('/')}
      />
    );
  }

  return (
    <MainLayout role="employee">
      <EmployeeChat />
    </MainLayout>
  );
}

// Org Admin Protected Route Handler
function OrgRouteHandler({ user, checkAuth }: RouteHandlerProps) {
  const navigate = useNavigate();

  if (!user) {
    return (
      <Login
        onLogin={async (userData) => {
          const u = await checkAuth();
          navigate(getRedirectPathForUser(u || userData), { replace: true });
        }}
        onBackToHome={() => navigate('/')}
      />
    );
  }

  if (user.role !== 'ORG_ADMIN' && user.role !== 'ADMIN') {
    return <Navigate to="/copilot" replace />;
  }

  return (
    <MainLayout role="org">
      <Outlet />
    </MainLayout>
  );
}

// Platform Admin Protected Route Handler
function PlatformAdminRouteHandler({ user, checkAuth }: RouteHandlerProps) {
  const navigate = useNavigate();

  if (!user) {
    return (
      <Login
        onLogin={async (userData) => {
          const u = await checkAuth();
          navigate(getRedirectPathForUser(u || userData), { replace: true });
        }}
        onBackToHome={() => navigate('/')}
      />
    );
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to={user.role === 'ORG_ADMIN' ? '/org' : '/copilot'} replace />;
  }

  return (
    <MainLayout role="platform">
      <Outlet />
    </MainLayout>
  );
}

function AppRoutes({ user, checkAuth }: { user: any; checkAuth: () => Promise<any> }) {
  const navigate = useNavigate();

  const handleLaunchCopilot = () => {
    navigate('/copilot');
  };

  const handleSelectPrompt = (prompt: string) => {
    navigate(`/copilot?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <Routes>
      {/* 1. HOME (/) and (/welcome) */}
      <Route
        path="/"
        element={
          <HomePage
            onLaunchCopilot={handleLaunchCopilot}
            onSelectPrompt={handleSelectPrompt}
          />
        }
      />
      <Route
        path="/welcome"
        element={
          <HomePage
            onLaunchCopilot={handleLaunchCopilot}
            onSelectPrompt={handleSelectPrompt}
          />
        }
      />

      {/* 2. FOR STUDENTS (/for-students) */}
      <Route path="/for-students" element={<ForStudentsPage />} />

      {/* 3. HOW TO USE (/how-to-use) */}
      <Route path="/how-to-use" element={<HowToUsePage />} />

      {/* 4. KNOWLEDGE BASE (/knowledge-base) */}
      <Route path="/knowledge-base" element={<KnowledgeBasePage />} />

      {/* Legacy Aliases & Secondary Redirects */}
      <Route path="/platform" element={<Navigate to="/for-students" replace />} />
      <Route path="/how-it-works" element={<Navigate to="/how-to-use" replace />} />

      {/* 5. COPILOT (/copilot and /chat) - Both directly open the Chat */}
      <Route
        path="/copilot"
        element={<CopilotRouteHandler user={user} checkAuth={checkAuth} />}
      />
      <Route
        path="/chat"
        element={<CopilotRouteHandler user={user} checkAuth={checkAuth} />}
      />
      <Route path="/search" element={<Navigate to="/copilot" replace />} />

      {/* 6. Dedicated LOGIN Route (/login) */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate
              to={getRedirectPathForUser(user)}
              replace
            />
          ) : (
            <Login
              onLogin={async (userData) => {
                const u = await checkAuth();
                navigate(getRedirectPathForUser(u || userData), { replace: true });
              }}
              onBackToHome={() => navigate('/')}
            />
          )
        }
      />

      {/* 7. Organization Admin Routes (/org) */}
      <Route path="/org" element={<OrgRouteHandler user={user} checkAuth={checkAuth} />}>
        <Route index element={<OrgAdmin />} />
        <Route path="knowledge" element={<DocumentBase />} />
        <Route path="users" element={<OrgAdmin />} />
        <Route path="ai-config" element={<OrgAdmin />} />
      </Route>

      {/* 8. Platform Admin Routes (/admin/platform) & legacy /admin */}
      <Route path="/admin" element={<Navigate to="/admin/platform" replace />} />
      <Route path="/admin/platform" element={<PlatformAdminRouteHandler user={user} checkAuth={checkAuth} />}>
        <Route index element={<PlatformAdmin />} />
        <Route path="orgs" element={<PlatformOrgs />} />
        <Route path="settings" element={<PlatformAdmin />} />
      </Route>

      {/* Fallback to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

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
      return userData;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
          background: '#060912',
          color: '#F8FAFC',
          gap: '14px',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}
      >
        <Loader2 size={32} className="animate-spin" color="#38BDF8" />
        <span style={{ fontSize: '0.92rem', color: '#94A3B8', fontWeight: 500 }}>
          Initializing VIT-AP Copilot...
        </span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes user={user} checkAuth={checkAuth} />
    </BrowserRouter>
  );
}

export default App;
