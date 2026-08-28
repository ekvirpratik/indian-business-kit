import { useUser, useAuth } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '@/lib/supabase';
import { fetchMyProfile, fetchIsEntitled } from '../services/auth.service';
import { resolveOnboardingState } from '../services/onboarding.resolver';
import { useInvitationToken } from './useInvitationToken';
import type { UserProfile, UserRole, OnboardingState } from '@/types/auth';

export interface UseCurrentUserReturn {
  clerkUser: ReturnType<typeof useUser>['user'];
  profile: UserProfile | null;
  role: UserRole | null;
  companyId: string | null;
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
  onboardingState: OnboardingState;
  isEntitled: boolean;
  isLoading: boolean;
  isSignedIn: boolean;
  refetchProfile: () => void;
}

/**
 * Primary identity and profile hook for PeakHR.
 * Combines Clerk authentication identity with PostgreSQL profile data from Supabase.
 */
export function useCurrentUser(): UseCurrentUserReturn {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const { sessionId } = useAuth();
  const supabase = useSupabase();
  const { token: invitationToken } = useInvitationToken();

  // 1. Fetch user's PeakHR profile from Supabase
  const {
    data: profile = null,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['current-user-profile', clerkUser?.id],
    queryFn: () => fetchMyProfile(supabase, clerkUser!.id),
    enabled: Boolean(isClerkLoaded && isSignedIn && clerkUser?.id),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // 2. Check platform membership entitlement if user belongs to a company
  const { data: isEntitled = true, isLoading: isEntitlementLoading } = useQuery({
    queryKey: ['current-user-entitlement', clerkUser?.id, profile?.companyId],
    queryFn: () => fetchIsEntitled(supabase),
    enabled: Boolean(profile?.companyId),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = !isClerkLoaded || (Boolean(isSignedIn) && isProfileLoading) || (Boolean(profile?.companyId) && isEntitlementLoading);

  const role: UserRole | null = profile?.role ?? null;
  const companyId: string | null = profile?.companyId ?? null;
  const isAdmin = role === 'super_admin' || role === 'company_admin';
  const isManager = role === 'manager';
  const isEmployee = role === 'employee';

  const onboardingState = resolveOnboardingState({
    isSignedIn: Boolean(isSignedIn && sessionId),
    profile,
    isEntitled,
    invitationToken,
  });

  return {
    clerkUser: clerkUser ?? null,
    profile,
    role,
    companyId,
    isAdmin,
    isManager,
    isEmployee,
    onboardingState,
    isEntitled,
    isLoading,
    isSignedIn: Boolean(isSignedIn),
    refetchProfile,
  };
}
