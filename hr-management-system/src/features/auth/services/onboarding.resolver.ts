import type { UserProfile, OnboardingState } from '@/types/auth';

export interface ResolveOnboardingInput {
  isSignedIn: boolean;
  profile: UserProfile | null;
  isEntitled?: boolean;
  invitationToken?: string | null;
}

/**
 * Pure domain resolver for determining the user's post-authentication state and routing destination.
 *
 * Decision Tree:
 * 1. Has pending invitation token context? → 'needs_invitation' (/invite/:token)
 * 2. Authenticated with Clerk but no PeakHR profile? → 'needs_company' (/onboarding/create-company)
 * 3. Profile status is inactive? → 'profile_suspended' (/access-suspended)
 * 4. Company owner platform membership expired? → 'membership_expired' (/subscription-required)
 * 5. Active profile + active membership? → 'ready' (/dashboard)
 */
export function resolveOnboardingState({
  isSignedIn,
  profile,
  isEntitled = true,
  invitationToken = null,
}: ResolveOnboardingInput): OnboardingState {
  if (!isSignedIn) {
    return 'needs_subscription';
  }

  // If the user arrived with or holds a preserved invitation token, prioritize accepting it
  if (invitationToken && !profile) {
    return 'needs_invitation';
  }

  // Clerk signed in, but no PeakHR profile exists yet -> Purchaser needs to create company
  if (!profile) {
    return 'needs_company';
  }

  // Profile exists but marked inactive/suspended by admin
  if (profile.status === 'inactive') {
    return 'profile_suspended';
  }

  // Profile exists, but the company's platform membership is not active / expired
  if (isEntitled === false) {
    return 'membership_expired';
  }

  // Active user with active membership
  return 'ready';
}
