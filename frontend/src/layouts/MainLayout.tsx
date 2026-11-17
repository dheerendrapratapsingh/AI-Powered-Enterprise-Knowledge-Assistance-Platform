import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Zap, ChevronRight } from 'lucide-react';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
  role: 'platform' | 'org' | 'employee';
  children?: React.ReactNode;
}

export function MainLayout({ role, children }: MainLayoutProps) {
  const location = useLocation();

  const isChatRoute = location.pathname.startsWith('/chat') || location.pathname.startsWith('/copilot');

  // Full-viewport immersion for chat workspace with its unified single sidebar
  if (isChatRoute) {
    return (
      <div style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
        {children || <Outlet />}
      </div>
    );
  }

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/chat') || path.includes('/copilot')) return 'AI Copilot Assistant';
    if (path.includes('/search')) return 'Knowledge Search';
    if (path.includes('/org/knowledge')) return 'Knowledge Base Documents';
    if (path.includes('/org')) return 'Organization Dashboard';
    if (path.includes('/platform/orgs')) return 'Tenant Organizations';
    if (path.includes('/platform')) return 'Platform Administration';
    return 'Campus Intelligence';
  };

  return (
    <div className={styles.mainLayout}>
      <Sidebar role={role} />
      
      <div className={styles.contentContainer}>
        {/* Header Topbar */}
        <header className={styles.topbar}>
          <div className={styles.breadcrumbs}>
            <span className={styles.breadcrumbRoot}>VIT-AP Copilot</span>
            <ChevronRight size={13} className={styles.breadcrumbSeparator} />
            <span className={styles.breadcrumbCurrent}>{getPageTitle()}</span>
          </div>

          <div className={styles.topbarActions}>
            <div className={styles.engineIndicator} title="System Status: Operational">
              <span className={styles.engineDot}></span>
              <Zap size={12} color="var(--accent-cyan)" />
              <span>Campus AI Active</span>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className={styles.mainView}>
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
