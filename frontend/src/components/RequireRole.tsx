import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RequireRoleProps {
  allowedRoles: string[];
}

/**
 * Role-Based Access Control Route Guard for Frontend Screen Access
 * Restricts route access strictly based on authenticated user's role.
 */
export default function RequireRole({ allowedRoles }: RequireRoleProps) {
  const { user } = useAuth();
  const userRole = (user?.role || 'STUDENT').toUpperCase();

  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
  const isAllowed = userRole === 'ADMIN' || normalizedAllowed.includes(userRole);

  if (!isAllowed) {
    // Redirect user to their role's authorized default home screen
    if (userRole === 'REVIEWER') {
      return <Navigate to="/reviewer" replace />;
    } else if (userRole === 'EMPLOYER') {
      return <Navigate to="/discover" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
