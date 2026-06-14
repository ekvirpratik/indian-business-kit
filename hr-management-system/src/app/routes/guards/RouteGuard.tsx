import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import { useAuth } from "@/app/providers/AuthProvider";

interface GuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: GuardProps) {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null; // Or a skeleton/loading state handled at route level
  }

  if (!session) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function GuestGuard({ children }: GuardProps) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (session) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}

interface RoleGuardProps extends GuardProps {
  roles: string[];
}

export function RoleGuard({ children, roles }: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  const userRole = user?.app_metadata?.role as string | undefined;

  if (!userRole || !roles.includes(userRole)) {
    return <Navigate to={ROUTES.DASHBOARD} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
