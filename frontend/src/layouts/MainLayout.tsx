import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Zap, ChevronRight } from 'lucide-react';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
  role: 'platform' | 'org' | 'employee';
}

export function MainLayout({ role }: MainLayoutProps) {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/chat')) return 'AI Copilot Assistant';
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
            <div className={styles.engineIndicator} title="Primary LLM: Google Gemini 2.0 Flash with local Ollama fallback">
              <span className={styles.engineDot}></span>
              <Zap size={12} color="var(--accent-cyan)" />
              <span>Gemini 2.0 Flash</span>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className={styles.mainView}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
