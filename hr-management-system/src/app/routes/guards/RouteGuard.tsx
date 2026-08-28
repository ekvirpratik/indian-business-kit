import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { PageSkeleton } from '@/components/skeletons/PageSkeleton';

interface GuardProps {
  children: ReactNode;
}

/**
 * Protects authenticated dashboard routes.
 * Ensures the user is authenticated and in the 'ready' onboarding state before granting dashboard access.
 */
export function AuthGuard({ children }: GuardProps) {
  const { isSignedIn, isLoading, onboardingState } = useCurrentUser();
  const location = useLocation();

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!isSignedIn) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Handle distinct onboarding/access states
  if (onboardingState === 'needs_company') {
    return <Navigate to={ROUTES.ONBOARDING_CREATE_COMPANY} replace />;
  }

  if (onboardingState === 'profile_suspended') {
    return <Navigate to={ROUTES.ACCESS_SUSPENDED} replace />;
  }

  if (onboardingState === 'membership_expired') {
    return <Navigate to={ROUTES.SUBSCRIPTION_REQUIRED} replace />;
  }

  return <>{children}</>;
}

/**
 * Guards public auth pages (sign-in, sign-up).
 * If the user is already authenticated, redirects them to post-auth routing gateway.
 */
export function GuestGuard({ children }: GuardProps) {
  const { isSignedIn, isLoading } = useCurrentUser();

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (isSignedIn) {
    return <Navigate to={ROUTES.POST_AUTH} replace />;
  }

  return <>{children}</>;
}

interface RoleGuardProps extends GuardProps {
  roles: string[];
}

/**
 * Enforces role-based UI access on routes for company_admin, manager, etc.
 */
export function RoleGuard({ children, roles }: RoleGuardProps) {
  const { role, isLoading } = useCurrentUser();
  const location = useLocation();

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!role || !roles.includes(role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
