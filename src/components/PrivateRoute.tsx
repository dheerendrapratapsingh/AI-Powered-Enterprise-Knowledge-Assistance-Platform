import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * Wraps routes that require authentication.
 * If not logged in → redirect to /login.
 * If logged in but wrong role → redirect to their home portal.
 */
export function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-muted)',
        fontSize: '0.9rem', letterSpacing: '0.05em'
      }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the correct home for this role
    const home = user.role === 'platform_admin' ? '/platform'
      : user.role === 'org_admin' ? '/org'
      : '/chat';
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
