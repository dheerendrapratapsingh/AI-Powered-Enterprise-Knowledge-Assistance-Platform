import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { PlatformAdmin } from './pages/PlatformAdmin';
import { EmployeeChat } from './pages/EmployeeChat';
import { OrgAdmin } from './pages/OrgAdmin';

function App() {
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
          <Route path="knowledge" element={<div>Knowledge Base (Coming Soon)</div>} />
          <Route path="users" element={<div>Users & Roles (Coming Soon)</div>} />
          <Route path="ai-config" element={<div>AI Configuration (Coming Soon)</div>} />
        </Route>

        {/* Employee Routes */}
        <Route path="/chat" element={<MainLayout role="employee" />}>
          <Route index element={<EmployeeChat />} />
        </Route>
        
        {/* Redirect root to platform admin for now */}
        <Route path="/" element={<Navigate to="/platform" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
