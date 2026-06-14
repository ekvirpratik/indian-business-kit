import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

interface GuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: GuardProps) {
  const { session, isLoading } = useCurrentUser();
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
  const { session, isLoading } = useCurrentUser();

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
  const { role, isLoading } = useCurrentUser();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!role || !roles.includes(role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
