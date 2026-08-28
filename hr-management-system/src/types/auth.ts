/**
 * Auth types for PeakHR.
 *
 * These map directly to the `public.profiles` table structure
 * established in the Phase 3 migration.
 */

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

export type UserRole =
  | 'super_admin'
  | 'company_admin'
  | 'manager'
  | 'employee';

// ---------------------------------------------------------------------------
// Profile (mirrors public.profiles)
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string;
  clerkUserId: string;
  companyId: string | null;
  employeeId: string | null;
  role: UserRole;
  status: 'active' | 'inactive' | 'invited';
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Onboarding State
//
// Returned by resolveOnboardingState().
// Each state maps to a distinct UI destination:
//
//   needs_subscription  → /subscription-required
//   needs_company       → /onboarding/create-company
//   needs_invitation    → handled via invitation token flow (not resolvable
//                         from profile/subscription alone — token is source of truth)
//   membership_expired  → /subscription-required (renewal)
//   profile_suspended   → /access-suspended
//   ready               → /dashboard
// ---------------------------------------------------------------------------

export type OnboardingState =
  | 'needs_subscription'
  | 'needs_company'
  | 'needs_invitation'
  | 'membership_expired'
  | 'profile_suspended'
  | 'ready';

// ---------------------------------------------------------------------------
// Access State (returned by get_my_peakhr_access_state RPC)
// Minimal entitlement data — never exposes subscription amounts/dates.
// ---------------------------------------------------------------------------

export interface AccessState {
  hasActiveMembership: boolean;
  membershipExpired: boolean;
  hasCompany: boolean;
  profileStatus: 'active' | 'inactive' | 'none';
}

// ---------------------------------------------------------------------------
// JWT Claims (returned by inspect_clerk_jwt_claims RPC)
// ---------------------------------------------------------------------------

export interface JwtClaims {
  claimSub: string | null;
  claimEmail: string | null;
  claimRole: string | null;
  claimIss: string | null;
  claimExp: number | null;
}

// ---------------------------------------------------------------------------
// Current User (returned by useCurrentUser hook)
// ---------------------------------------------------------------------------

export interface CurrentUser {
  /** Clerk user ID */
  clerkId: string;
  /** Email from Clerk */
  email: string;
  /** PeakHR profile — null if not yet created (purchaser/invited employee) */
  profile: UserProfile | null;
  role: UserRole | null;
  companyId: string | null;
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
}
