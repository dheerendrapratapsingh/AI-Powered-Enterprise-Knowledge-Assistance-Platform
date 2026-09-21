import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
  role: 'platform' | 'org' | 'employee';
}

export function MainLayout({ role }: MainLayoutProps) {
  return (
    <div className="app-container">
      <Sidebar role={role} />
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}
