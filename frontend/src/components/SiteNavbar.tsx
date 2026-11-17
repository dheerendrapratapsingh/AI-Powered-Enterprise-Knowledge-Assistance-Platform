import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bot, ArrowRight, Menu, X } from 'lucide-react';
import styles from './SiteNavbar.module.css';

interface SiteNavbarProps {
  onLaunchCopilot?: () => void;
}

export function SiteNavbar({ onLaunchCopilot }: SiteNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLaunch = () => {
    setMobileMenuOpen(false);
    if (onLaunchCopilot) {
      onLaunchCopilot();
    } else {
      navigate('/copilot');
    }
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.navContainer}>
        {/* Brand */}
        <NavLink to="/" className={styles.brand} onClick={() => setMobileMenuOpen(false)}>
          <div className={styles.brandEmblem}>
            <Bot size={18} color="#FFFFFF" />
          </div>
          <div className={styles.brandTextGroup}>
            <span className={styles.brandTitle}>VIT-AP Copilot</span>
            <span className={styles.brandSubtitle}>Student Knowledge Companion</span>
          </div>
        </NavLink>

        {/* Desktop Navigation Links */}
        <nav className={styles.navLinks}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)}
          >
            Home
          </NavLink>
          <NavLink
            to="/for-students"
            className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)}
          >
            For Students
          </NavLink>
          <NavLink
            to="/how-to-use"
            className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)}
          >
            How to Use
          </NavLink>
          <NavLink
            to="/knowledge-base"
            className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)}
          >
            Knowledge Base
          </NavLink>
        </nav>

        {/* Action Button */}
        <div className={styles.navActions}>
          <button className={styles.launchBtn} onClick={handleLaunch}>
            <span>Launch Copilot</span>
            <ArrowRight size={14} />
          </button>

          <button
            className={styles.mobileToggleBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className={styles.mobileDrawer}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? `${styles.mobileLink} ${styles.mobileLinkActive}` : styles.mobileLink)}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </NavLink>
          <NavLink
            to="/for-students"
            className={({ isActive }) => (isActive ? `${styles.mobileLink} ${styles.mobileLinkActive}` : styles.mobileLink)}
            onClick={() => setMobileMenuOpen(false)}
          >
            For Students
          </NavLink>
          <NavLink
            to="/how-to-use"
            className={({ isActive }) => (isActive ? `${styles.mobileLink} ${styles.mobileLinkActive}` : styles.mobileLink)}
            onClick={() => setMobileMenuOpen(false)}
          >
            How to Use
          </NavLink>
          <NavLink
            to="/knowledge-base"
            className={({ isActive }) => (isActive ? `${styles.mobileLink} ${styles.mobileLinkActive}` : styles.mobileLink)}
            onClick={() => setMobileMenuOpen(false)}
          >
            Knowledge Base
          </NavLink>
          <div className={styles.mobileDrawerActions}>
            <button className={styles.mobileLaunchBtn} onClick={handleLaunch}>
              <span>Launch Copilot</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
