import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

const ADMIN_ROLE = 'admin';

const isAdmin = () => {
  return localStorage.getItem('userRole') === ADMIN_ROLE;
};

export const AdminRoute = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  if (!isAdmin()) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};
