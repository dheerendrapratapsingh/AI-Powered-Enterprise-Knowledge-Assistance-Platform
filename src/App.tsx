import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './pages/Login';
import { PlatformAdmin } from './pages/PlatformAdmin';
import { PlatformOrgs } from './pages/PlatformOrgs';
import { PlatformSettings } from './pages/PlatformSettings';
import { OrgAdmin } from './pages/OrgAdmin';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { UsersRoles } from './pages/UsersRoles';
import { AIConfig } from './pages/AIConfig';
import { EmployeeChat } from './pages/EmployeeChat';
import { EnterpriseSearch } from './pages/EnterpriseSearch';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Platform Admin Routes */}
          <Route
            path="/platform"
            element={
              <PrivateRoute allowedRoles={['platform_admin']}>
                <MainLayout role="platform" />
              </PrivateRoute>
            }
          >
            <Route index element={<PlatformAdmin />} />
            <Route path="orgs" element={<PlatformOrgs />} />
            <Route path="settings" element={<PlatformSettings />} />
          </Route>

          {/* Organization Admin Routes */}
          <Route
            path="/org"
            element={
              <PrivateRoute allowedRoles={['org_admin', 'platform_admin']}>
                <MainLayout role="org" />
              </PrivateRoute>
            }
          >
            <Route index element={<OrgAdmin />} />
            <Route path="knowledge" element={<KnowledgeBase />} />
            <Route path="users" element={<UsersRoles />} />
            <Route path="ai-config" element={<AIConfig />} />
          </Route>

          {/* Employee Routes */}
          <Route
            path="/chat"
            element={
              <PrivateRoute allowedRoles={['employee', 'org_admin', 'platform_admin']}>
                <MainLayout role="employee" />
              </PrivateRoute>
            }
          >
            <Route index element={<EmployeeChat />} />
          </Route>

          {/* Enterprise Search Route */}
          <Route
            path="/search"
            element={
              <PrivateRoute allowedRoles={['employee', 'org_admin', 'platform_admin']}>
                <MainLayout role="employee" />
              </PrivateRoute>
            }
          >
            <Route index element={<EnterpriseSearch />} />
          </Route>

          {/* Default Redirect: Send unauthenticated/root users to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
