import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { getUserFromToken } from '../../utils/auth';

const isAdmin = () => {
  return getUserFromToken()?.role === 'admin';
};

export const AdminRoute = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  if (!isAdmin()) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};
