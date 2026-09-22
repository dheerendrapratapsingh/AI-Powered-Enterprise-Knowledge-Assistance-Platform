import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, Settings, Database, MessageSquare, Search, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './Sidebar.module.css';

interface SidebarProps {
  role: 'platform' | 'org' | 'employee';
}

export function Sidebar({ role }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}></div>
          <span className="gradient-text">NexaAI</span>
        </div>
        <div className={styles.tenantContext}>
          {role === 'platform' && 'Platform Administration'}
          {role === 'org' && `${user?.orgName || 'Acme Corp'} Admin`}
          {role === 'employee' && `${user?.orgName || 'Acme Corp'} Workspace`}
        </div>
      </div>

      <nav className={styles.nav}>
        {role === 'platform' && (
          <>
            <div className={styles.navSection}>Overview</div>
            <NavLink to="/platform" end className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
              <LayoutDashboard size={18} />
              Platform Dashboard
            </NavLink>
            <NavLink to="/platform/orgs" className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
              <Building2 size={18} />
              Organizations
            </NavLink>
            <NavLink to="/platform/settings" className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
              <Settings size={18} />
              System Settings
            </NavLink>
          </>
        )}

        {role === 'org' && (
          <>
            <div className={styles.navSection}>Organization</div>
            <NavLink to="/org" end className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            <NavLink to="/org/knowledge" className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
              <Database size={18} />
              Knowledge Base
            </NavLink>
            <NavLink to="/org/users" className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
              <Users size={18} />
              Users & Roles
            </NavLink>
            <NavLink to="/org/ai-config" className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
              <Settings size={18} />
              AI Configuration
            </NavLink>
          </>
        )}

        {role === 'employee' && (
          <>
            <div className={styles.navSection}>Workspace</div>
            <NavLink to="/chat" className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
              <MessageSquare size={18} />
              AI Assistant
            </NavLink>
            <NavLink to="/search" className={({ isActive }) => (isActive ? styles.activeLink : styles.link)}>
              <Search size={18} />
              Enterprise Search
            </NavLink>
          </>
        )}
      </nav>

      <div className={styles.footer}>
        <div className={styles.userProfile}>
          <div className={styles.avatar}>{user?.avatarInitial || 'U'}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name || 'User'}</span>
            <span className={styles.userRole}>
              {user?.role ? user.role.replace('_', ' ') : role}
            </span>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
