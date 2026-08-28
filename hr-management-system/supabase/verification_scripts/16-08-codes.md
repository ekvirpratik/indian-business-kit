# Phase 4 — Clerk ↔ Supabase Frontend Integration Source Codes
**Date:** 16-08-2026  
**Module:** PeakHR — Native Clerk ↔ Supabase Third-Party Auth Integration

---

## Table of Contents

1. [src/types/auth.ts](#1-srctypesauthts)
2. [src/types/index.ts](#2-srctypesindexts)
3. [src/constants/roles.ts](#3-srcconstantsrolests)
4. [src/constants/routes.ts](#4-srcconstantsroutests)
5. [src/constants/navigation.ts](#5-srcconstantsnavigationts)
6. [src/lib/supabase/client.ts](#6-srclibsupabaseclientts)
7. [src/lib/supabase/SupabaseProvider.tsx](#7-srclibsupabasesupabaseprovidertsx)
8. [src/lib/supabase/index.ts](#8-srclibsupabaseindexts)
9. [src/features/auth/services/auth.service.ts](#9-srcfeaturesauthservicesauthservicets)
10. [src/features/auth/services/onboarding.resolver.ts](#10-srcfeaturesauthservicesonboardingresolverts)
11. [src/features/auth/hooks/useCurrentUser.ts](#11-srcfeaturesauthhooksusecurrentuserts)
12. [src/features/auth/hooks/useInvitationToken.ts](#12-srcfeaturesauthhooksuseinvitationtokents)
13. [src/features/auth/pages/SignInPage.tsx](#13-srcfeaturesauthpagessigninpagetsx)
14. [src/features/auth/pages/SignUpPage.tsx](#14-srcfeaturesauthpagessignuppagetsx)
15. [src/features/auth/pages/PostAuthPage.tsx](#15-srcfeaturesauthpagespostauthpagetsx)
16. [src/features/auth/pages/InvitationPage.tsx](#16-srcfeaturesauthpagesinvitationpagetsx)
17. [src/features/auth/pages/CreateCompanyPage.tsx](#17-srcfeaturesauthpagescreatecompanypagetsx)
18. [src/features/core/pages/SubscriptionRequiredPage.tsx](#18-srcfeaturescorepagessubscriptionrequiredpagetsx)
19. [src/features/core/pages/AccessSuspendedPage.tsx](#19-srcfeaturescorepagesaccesssuspendedpagetsx)
20. [src/features/dev/components/JwtClaimsInspector.tsx](#20-srcfeaturesdevcomponentsjwtclaimsinspectortsx)
21. [src/features/dev/pages/DesignSystemPage.tsx](#21-srcfeaturesdevpagesdesignsystempagetsx)
22. [src/app/providers/AppProviders.tsx](#22-srcappprovidersappproviderstsx)
23. [src/app/routes/guards/RouteGuard.tsx](#23-srcapproutesguardsrouteguardtsx)
24. [src/app/routes/index.tsx](#24-srcapproutesindextsx)
25. [src/app/layouts/DashboardLayout/UserNav.tsx](#25-srcapplayoutsdashboardlayoutusernavtsx)

---

### 1. `src/types/auth.ts`

```typescript
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
```

---

### 2. `src/types/index.ts`

```typescript
export * from './auth';
```

---

### 3. `src/constants/roles.ts`

```typescript
import type { UserRole } from '@/types/auth';

/**
 * Role constants for PeakHR.
 * Always use these — never raw strings like "admin".
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin' as UserRole,
  COMPANY_ADMIN: 'company_admin' as UserRole,
  MANAGER: 'manager' as UserRole,
  EMPLOYEE: 'employee' as UserRole,
} as const;

/** Roles that can manage company settings */
export const ADMIN_ROLES: UserRole[] = [ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN];

/** Roles that can manage employees */
export const MANAGER_ROLES: UserRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.COMPANY_ADMIN,
  ROLES.MANAGER,
];
```

---

### 4. `src/constants/routes.ts`

```typescript
export const ROUTES = {
  // Public
  HOME: '/',

  // Auth (GuestGuard)
  LOGIN: '/sign-in',
  REGISTER: '/sign-up',

  // Invitation flow — token preserved through auth
  INVITATION: '/invite/:token',

  // Post-auth gateway — single place that resolves onboarding state
  POST_AUTH: '/auth/callback',

  // Onboarding flows
  ONBOARDING_CREATE_COMPANY: '/onboarding/create-company',
  SUBSCRIPTION_REQUIRED: '/subscription-required',
  ACCESS_SUSPENDED: '/access-suspended',

  // Error pages
  UNAUTHORIZED: '/403',

  // Protected (AuthGuard)
  DASHBOARD: '/dashboard',
  EMPLOYEES: '/employees',
  ATTENDANCE: '/attendance',
  LEAVES: '/leaves',
  SETTINGS: '/settings',

  // Dev routes (dev only)
  DESIGN_SYSTEM: '/dev/design-system',
} as const;
```

---

### 5. `src/constants/navigation.ts`

```typescript
import { Home, Users, Calendar, Clock, Settings } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { ROLES, ADMIN_ROLES, MANAGER_ROLES } from '@/constants/roles';

export const sidebarItems = [
  {
    title: 'Dashboard',
    icon: Home,
    href: ROUTES.DASHBOARD,
    roles: [ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE],
  },
  {
    title: 'Employees',
    icon: Users,
    href: ROUTES.EMPLOYEES,
    roles: MANAGER_ROLES,
  },
  {
    title: 'Attendance',
    icon: Clock,
    href: ROUTES.ATTENDANCE,
    roles: [ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE],
  },
  {
    title: 'Leaves',
    icon: Calendar,
    href: ROUTES.LEAVES,
    roles: [ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE],
  },
  {
    title: 'Settings',
    icon: Settings,
    href: ROUTES.SETTINGS,
    roles: ADMIN_ROLES,
  },
];
```

---

### 6. `src/lib/supabase/client.ts`

```typescript
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Create a Supabase client that injects the active Clerk session token
 * into every request via the `accessToken` callback.
 *
 * This is the NATIVE Clerk ↔ Supabase Third-Party Auth integration.
 *
 * Rules:
 * - Do NOT use getToken({ template: 'supabase' }) — deprecated.
 * - Do NOT use service_role key in this file or anywhere in frontend code.
 * - The anon key is used here; RLS policies enforce all data access.
 *
 * @param getToken - Async function that returns the current Clerk session JWT.
 *                   Provided by useSession().session?.getToken() via SupabaseProvider.
 */
export function createClerkSupabaseClient(
  getToken: () => Promise<string | null>
): SupabaseClient {
  return createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    global: {
      fetch: async (url, options = {}) => {
        const token = await getToken();

        const headers = new Headers(options.headers);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }

        return fetch(url, { ...options, headers });
      },
    },
    auth: {
      // Disable Supabase's built-in auth — Clerk owns authentication.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
```

---

### 7. `src/lib/supabase/SupabaseProvider.tsx`

```typescript
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useSession } from '@clerk/clerk-react';
import { type SupabaseClient } from '@supabase/supabase-js';
import { createClerkSupabaseClient } from './client';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const SupabaseContext = createContext<SupabaseClient | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface SupabaseProviderProps {
  children: ReactNode;
}

/**
 * Provides an authenticated Supabase client to the entire app tree.
 *
 * Must be placed INSIDE ClerkProvider so it has access to the Clerk session.
 *
 * The client is memoized on `session` identity — it is recreated only when
 * the Clerk session changes (sign-in / sign-out), not on every render.
 */
export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const { session } = useSession();

  const supabase = useMemo(() => {
    // getToken() — standard Clerk session token.
    // NOT getToken({ template: 'supabase' }) which is deprecated.
    const getToken = async (): Promise<string | null> => {
      if (!session) return null;
      return session.getToken();
    };

    return createClerkSupabaseClient(getToken);

    // Re-create the client when the session identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns the authenticated Supabase client.
 * All Supabase calls in the app must go through this hook (via services).
 *
 * @throws If used outside of SupabaseProvider.
 */
export function useSupabase(): SupabaseClient {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error('useSupabase must be used within a <SupabaseProvider>.');
  }
  return client;
}
```

---

### 8. `src/lib/supabase/index.ts`

```typescript
export * from './client';
export * from './SupabaseProvider';
export * from './types';
```

---

### 9. `src/features/auth/services/auth.service.ts`

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserProfile, JwtClaims } from '@/types/auth';

/**
 * Raw DB profile row representation from Supabase.
 */
interface ProfileRow {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  company_id: string | null;
  employee_id: string | null;
  role: 'super_admin' | 'company_admin' | 'manager' | 'employee';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Transforms a DB profile row into domain UserProfile.
 */
function mapProfileRow(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    companyId: row.company_id,
    employeeId: row.employee_id,
    role: row.role,
    status: row.is_active ? 'active' : 'inactive',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetches the user's profile from public.profiles using their Clerk User ID.
 * Under RLS policy 'profiles_select_self', users can always select their own profile.
 */
export async function fetchMyProfile(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<UserProfile | null> {
  if (!clerkUserId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, clerk_user_id, email, full_name, avatar_url, phone, company_id, employee_id, role, is_active, created_at, updated_at')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load profile: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapProfileRow(data as ProfileRow);
}

/**
 * Calls public._is_entitled() to check if current company/user has an active membership.
 * Safe entitlement check: doesn't expose platform billing table details to frontend.
 */
export async function fetchIsEntitled(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc('_is_entitled');

  if (error) {
    // If the function errors or user has no profile/company, is_entitled returns false
    return false;
  }

  return Boolean(data);
}

/**
 * Calls the dev-only RPC inspect_clerk_jwt_claims() to inspect real JWT claims seen by PostgreSQL.
 */
export async function fetchJwtClaims(supabase: SupabaseClient): Promise<JwtClaims> {
  const { data, error } = await supabase.rpc('inspect_clerk_jwt_claims');

  if (error) {
    throw new Error(`RPC inspect_clerk_jwt_claims failed: ${error.message}`);
  }

  const claimRow = Array.isArray(data) ? data[0] : data;

  if (!claimRow) {
    return {
      claimSub: null,
      claimEmail: null,
      claimRole: null,
      claimIss: null,
      claimExp: null,
    };
  }

  return {
    claimSub: claimRow.claim_sub ?? null,
    claimEmail: claimRow.claim_email ?? null,
    claimRole: claimRow.claim_role ?? null,
    claimIss: claimRow.claim_iss ?? null,
    claimExp: claimRow.claim_exp ? Number(claimRow.claim_exp) : null,
  };
}

export interface InvitationValidationResult {
  companyName: string | null;
  maskedEmail: string | null;
  role: string | null;
  isValid: boolean;
}

/**
 * Validates an invitation raw token via public.validate_invitation() RPC.
 */
export async function validateInvitation(
  supabase: SupabaseClient,
  rawToken: string
): Promise<InvitationValidationResult> {
  const { data, error } = await supabase.rpc('validate_invitation', {
    p_raw_token: rawToken,
  });

  if (error) {
    throw new Error(`Failed to validate invitation: ${error.message}`);
  }

  const result = Array.isArray(data) ? data[0] : data;

  return {
    companyName: result?.out_company_name ?? null,
    maskedEmail: result?.out_masked_email ?? null,
    role: result?.out_role ?? null,
    isValid: Boolean(result?.out_is_valid),
  };
}

/**
 * Accepts an invitation using public.accept_invitation() RPC.
 */
export async function acceptInvitation(
  supabase: SupabaseClient,
  rawToken: string,
  fullName?: string
): Promise<string> {
  const { data, error } = await supabase.rpc('accept_invitation', {
    p_raw_token: rawToken,
    p_full_name: fullName || null,
  });

  if (error) {
    throw new Error(`Failed to accept invitation: ${error.message}`);
  }

  return data as string;
}

/**
 * Creates a company and owner admin profile using public.create_company_and_admin_profile() RPC.
 */
export async function createCompanyAndAdmin(
  supabase: SupabaseClient,
  companyName: string,
  timezone: string = 'Asia/Kolkata'
): Promise<string> {
  const { data, error } = await supabase.rpc('create_company_and_admin_profile', {
    p_company_name: companyName,
    p_timezone: timezone,
  });

  if (error) {
    throw new Error(`Failed to create company: ${error.message}`);
  }

  return data as string;
}
```

---

### 10. `src/features/auth/services/onboarding.resolver.ts`

```typescript
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
```

---

### 11. `src/features/auth/hooks/useCurrentUser.ts`

```typescript
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
```

---

### 12. `src/features/auth/hooks/useInvitationToken.ts`

```typescript
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const INVITE_TOKEN_STORAGE_KEY = 'peakhr_invite_token';

/**
 * Manages invitation token preservation across Clerk authentication redirects.
 * Uses sessionStorage (temporary tab session) so tokens are not permanently stored.
 */
export function useInvitationToken() {
  const { token: urlToken } = useParams<{ token?: string }>();
  const [storedToken, setStoredTokenState] = useState<string | null>(() => {
    return sessionStorage.getItem(INVITE_TOKEN_STORAGE_KEY);
  });

  // If token is found in the current URL, preserve it in sessionStorage
  useEffect(() => {
    if (urlToken && urlToken.trim().length > 0) {
      sessionStorage.setItem(INVITE_TOKEN_STORAGE_KEY, urlToken);
      setStoredTokenState(urlToken);
    }
  }, [urlToken]);

  const setInviteToken = useCallback((token: string) => {
    sessionStorage.setItem(INVITE_TOKEN_STORAGE_KEY, token);
    setStoredTokenState(token);
  }, []);

  const clearInviteToken = useCallback(() => {
    sessionStorage.removeItem(INVITE_TOKEN_STORAGE_KEY);
    setStoredTokenState(null);
  }, []);

  // Effective token is either current URL param or preserved session token
  const effectiveToken = urlToken || storedToken || null;

  return {
    token: effectiveToken,
    setInviteToken,
    clearInviteToken,
  };
}

/**
 * Non-hook helper for reading preserved invite token outside React components.
 */
export function getPreservedInviteToken(): string | null {
  return sessionStorage.getItem(INVITE_TOKEN_STORAGE_KEY);
}

export function clearPreservedInviteToken(): void {
  sessionStorage.removeItem(INVITE_TOKEN_STORAGE_KEY);
}
```

---

### 13. `src/features/auth/pages/SignInPage.tsx`

```typescript
import { SignIn } from '@clerk/clerk-react';
import { ROUTES } from '@/constants/routes';

export default function SignInPage() {
  return (
    <div className="flex justify-center items-center py-4">
      <SignIn
        routing="path"
        path={ROUTES.LOGIN}
        signUpUrl={ROUTES.REGISTER}
        fallbackRedirectUrl={ROUTES.POST_AUTH}
        appearance={{
          elements: {
            rootBox: 'w-full',
            card: 'shadow-none p-0 bg-transparent w-full',
            headerTitle: 'text-2xl font-bold text-foreground',
            headerSubtitle: 'text-muted-foreground',
            formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
            footerActionLink: 'text-primary hover:underline',
          },
        }}
      />
    </div>
  );
}
```

---

### 14. `src/features/auth/pages/SignUpPage.tsx`

```typescript
import { SignUp } from '@clerk/clerk-react';
import { ROUTES } from '@/constants/routes';

export default function SignUpPage() {
  return (
    <div className="flex justify-center items-center py-4">
      <SignUp
        routing="path"
        path={ROUTES.REGISTER}
        signInUrl={ROUTES.LOGIN}
        fallbackRedirectUrl={ROUTES.POST_AUTH}
        appearance={{
          elements: {
            rootBox: 'w-full',
            card: 'shadow-none p-0 bg-transparent w-full',
            headerTitle: 'text-2xl font-bold text-foreground',
            headerSubtitle: 'text-muted-foreground',
            formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
            footerActionLink: 'text-primary hover:underline',
          },
        }}
      />
    </div>
  );
}
```

---

### 15. `src/features/auth/pages/PostAuthPage.tsx`

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useInvitationToken } from '@/features/auth/hooks/useInvitationToken';
import { Loader2 } from 'lucide-react';

/**
 * Post-Authentication Gateway:
 * Single centralized page that inspects the loaded profile and entitlement state
 * and redirects the user to the correct product destination.
 */
export default function PostAuthPage() {
  const navigate = useNavigate();
  const { isLoading, isSignedIn, onboardingState } = useCurrentUser();
  const { token: invitationToken } = useInvitationToken();

  useEffect(() => {
    if (isLoading) return;

    if (!isSignedIn) {
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }

    switch (onboardingState) {
      case 'needs_invitation':
        if (invitationToken) {
          navigate(`/invite/${invitationToken}`, { replace: true });
        } else {
          navigate(ROUTES.DASHBOARD, { replace: true });
        }
        break;

      case 'needs_company':
        navigate(ROUTES.ONBOARDING_CREATE_COMPANY, { replace: true });
        break;

      case 'profile_suspended':
        navigate(ROUTES.ACCESS_SUSPENDED, { replace: true });
        break;

      case 'membership_expired':
        navigate(ROUTES.SUBSCRIPTION_REQUIRED, { replace: true });
        break;

      case 'ready':
      default:
        navigate(ROUTES.DASHBOARD, { replace: true });
        break;
    }
  }, [isLoading, isSignedIn, onboardingState, invitationToken, navigate]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Verifying your account...</h3>
        <p className="text-sm text-muted-foreground">Setting up your PeakHR workspace session</p>
      </div>
    </div>
  );
}
```

---

### 16. `src/features/auth/pages/InvitationPage.tsx`

```typescript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/lib/supabase';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useInvitationToken } from '@/features/auth/hooks/useInvitationToken';
import { validateInvitation, acceptInvitation } from '../services/auth.service';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from '@/lib/toast';
import { Building2, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function InvitationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const { token, clearInviteToken } = useInvitationToken();
  const { isSignedIn, clerkUser, refetchProfile } = useCurrentUser();
  const [isAccepting, setIsAccepting] = useState(false);

  const { data: invite, isLoading, isError } = useQuery({
    queryKey: ['invitation-validation', token],
    queryFn: () => validateInvitation(supabase, token!),
    enabled: Boolean(token),
    staleTime: 60 * 1000,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('No invitation token available');
      return acceptInvitation(supabase, token, clerkUser?.fullName || undefined);
    },
    onSuccess: async () => {
      toast.success('Invitation accepted successfully! Welcome to your team.');
      clearInviteToken();
      await queryClient.invalidateQueries({ queryKey: ['current-user-profile'] });
      refetchProfile();
      navigate(ROUTES.DASHBOARD, { replace: true });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to accept invitation. Please verify your email matches.');
      setIsAccepting(false);
    },
  });

  const handleAccept = () => {
    setIsAccepting(true);
    acceptMutation.mutate();
  };

  if (!token) {
    return (
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="w-6 h-6" />
          </div>
          <CardTitle>Missing Invitation Token</CardTitle>
          <CardDescription>No invitation token was provided in the link.</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild variant="outline">
            <Link to={ROUTES.LOGIN}>Return to Sign In</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="max-w-md mx-auto text-center py-12">
        <CardContent className="space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Validating your invitation...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError || !invite?.isValid) {
    return (
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="w-6 h-6" />
          </div>
          <CardTitle>Invalid or Expired Invitation</CardTitle>
          <CardDescription>
            This invitation link is invalid, expired, or has already been accepted.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild variant="outline">
            <Link to={ROUTES.LOGIN}>Return to Sign In</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto shadow-md">
      <CardHeader className="text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
          <Building2 className="w-6 h-6" />
        </div>
        <CardTitle className="text-xl">Team Invitation</CardTitle>
        <CardDescription>
          You have been invited to join <span className="font-semibold text-foreground">{invite.companyName}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role:</span>
            <span className="font-medium capitalize">{invite.role?.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Invited Email:</span>
            <span className="font-mono text-xs">{invite.maskedEmail}</span>
          </div>
        </div>

        {isSignedIn ? (
          <div className="text-sm text-center text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{clerkUser?.primaryEmailAddress?.emailAddress}</span>
          </div>
        ) : (
          <p className="text-xs text-center text-muted-foreground">
            Please sign in or create an account with your invited email to complete joining.
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        {isSignedIn ? (
          <Button onClick={handleAccept} disabled={isAccepting} className="w-full">
            {isAccepting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Accept Invitation & Join Team
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link to={ROUTES.LOGIN}>
              Sign In to Accept <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
```

---

### 17. `src/features/auth/pages/CreateCompanyPage.tsx`

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/lib/supabase';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { createCompanyAndAdmin } from '../services/auth.service';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from '@/lib/toast';
import { Building2, Loader2, Sparkles } from 'lucide-react';

const createCompanySchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(100, 'Company name is too long'),
  timezone: z.string().min(1, 'Timezone is required'),
});

type CreateCompanyFormValues = z.infer<typeof createCompanySchema>;

export default function CreateCompanyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const { refetchProfile } = useCurrentUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCompanyFormValues>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      companyName: '',
      timezone: 'Asia/Kolkata',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: CreateCompanyFormValues) => {
      return createCompanyAndAdmin(supabase, values.companyName, values.timezone);
    },
    onSuccess: async () => {
      toast.success('Company created successfully! Welcome to your HRMS dashboard.');
      await queryClient.invalidateQueries({ queryKey: ['current-user-profile'] });
      refetchProfile();
      navigate(ROUTES.DASHBOARD, { replace: true });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create company. Please ensure you have an active membership.');
    },
  });

  const onSubmit = (data: CreateCompanyFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1">
            <Building2 className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Set Up Your Organization</CardTitle>
          <CardDescription>
            Welcome to Indian Business Kit PeakHR. Let’s configure your company workspace to get started.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company / Organization Name</Label>
              <Input
                id="companyName"
                placeholder="e.g. Acme Technologies Private Limited"
                {...register('companyName')}
                className={errors.companyName ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {errors.companyName && (
                <p className="text-xs text-destructive">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Operating Timezone</Label>
              <Input
                id="timezone"
                placeholder="Asia/Kolkata"
                {...register('timezone')}
                className={errors.timezone ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">Default: Asia/Kolkata (Indian Standard Time)</p>
              {errors.timezone && (
                <p className="text-xs text-destructive">{errors.timezone.message}</p>
              )}
            </div>

            <div className="rounded-lg bg-primary/5 border border-primary/15 p-3.5 flex items-start gap-2.5 text-xs text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                As the organization creator, you will automatically be assigned the <strong>Company Admin</strong> role with full administrative privileges.
              </span>
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Workspace...
                </>
              ) : (
                'Create Company & Launch Dashboard'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
```

---

### 18. `src/features/core/pages/SubscriptionRequiredPage.tsx`

```typescript
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldAlert, ExternalLink, ArrowLeft } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

export default function SubscriptionRequiredPage() {
  const { clerkUser } = useCurrentUser();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="space-y-2">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-2">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <CardTitle className="text-2xl font-bold">Indian Business Kit Membership Required</CardTitle>
          <CardDescription>
            Access to PeakHR requires an active Indian Business Kit platform subscription.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Your current account <span className="font-medium text-foreground">({clerkUser?.primaryEmailAddress?.emailAddress})</span> does not have an active membership, or your subscription has expired.
          </p>
          <div className="rounded-lg bg-muted/50 p-3.5 text-xs text-left space-y-1.5">
            <p className="font-semibold text-foreground">What can you do?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Upgrade or renew your membership on the main platform.</li>
              <li>If you were invited as an employee, ask your company admin to verify your invitation status.</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2.5">
          <Button asChild className="w-full">
            <a href="https://indianbusinesskit.com/pricing" target="_blank" rel="noopener noreferrer">
              Get / Renew Membership <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to={ROUTES.LOGIN}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Return to Sign In
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

---

### 19. `src/features/core/pages/AccessSuspendedPage.tsx`

```typescript
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { UserX, ArrowLeft, Mail } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

export default function AccessSuspendedPage() {
  const { clerkUser } = useCurrentUser();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="space-y-2">
          <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
            <UserX className="w-7 h-7" />
          </div>
          <CardTitle className="text-2xl font-bold">Account Access Inactive</CardTitle>
          <CardDescription>
            Your PeakHR employee profile is currently set to inactive or suspended.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Your account <span className="font-medium text-foreground">({clerkUser?.primaryEmailAddress?.emailAddress})</span> has been deactivated by your organization administrator.
          </p>
          <div className="rounded-lg bg-muted/50 p-3.5 text-xs text-left">
            <p className="text-muted-foreground">
              Please contact your organization administrator or HR manager to reactivate your workspace access.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2.5">
          <Button asChild variant="outline" className="w-full">
            <a href="mailto:support@indianbusinesskit.com">
              <Mail className="w-4 h-4 mr-2" /> Contact HR Support
            </a>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link to={ROUTES.LOGIN}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Return to Sign In
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

---

### 20. `src/features/dev/components/JwtClaimsInspector.tsx`

```typescript
import { useState } from 'react';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useSupabase } from '@/lib/supabase';
import { fetchJwtClaims, fetchMyProfile } from '@/features/auth/services/auth.service';
import type { JwtClaims, UserProfile } from '@/types/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { toast } from '@/lib/toast';

interface VerificationCheck {
  title: string;
  actual: string | null;
  expected: string;
  passed: boolean;
  notes?: string;
}

interface InspectionResult {
  claims: JwtClaims;
  profileResult: UserProfile | null;
  checks: VerificationCheck[];
  allPassed: boolean;
}

export function JwtClaimsInspector() {
  const { clerkUser, isSignedIn, refetchProfile } = useCurrentUser();
  const supabase = useSupabase();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<InspectionResult | null>(null);

  const clerkEmail =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress ??
    null;

  const runInspection = async () => {
    if (!isSignedIn || !clerkUser) {
      toast.error('You must be signed in with Clerk to inspect live JWT claims.');
      return;
    }

    setIsRunning(true);
    try {
      const liveClaims = await fetchJwtClaims(supabase);
      const liveProfile = await fetchMyProfile(supabase, clerkUser.id);
      refetchProfile();

      const currentTimestamp = Date.now();
      const isExpValid = Boolean(liveClaims.claimExp && liveClaims.claimExp * 1000 > currentTimestamp);
      const formattedExp = liveClaims.claimExp
        ? new Date(liveClaims.claimExp * 1000).toLocaleTimeString()
        : null;

      const checks: VerificationCheck[] = [
        {
          title: 'Subject (sub)',
          actual: liveClaims.claimSub,
          expected: clerkUser.id,
          passed: Boolean(liveClaims.claimSub && liveClaims.claimSub === clerkUser.id),
        },
        {
          title: 'Email (email)',
          actual: liveClaims.claimEmail,
          expected: clerkEmail || '(clerk_email)',
          passed: Boolean(
            liveClaims.claimEmail &&
              clerkEmail &&
              liveClaims.claimEmail.toLowerCase() === clerkEmail.toLowerCase()
          ),
          notes: 'Required for trusted invitation validation and company admin binding.',
        },
        {
          title: 'Role (role)',
          actual: liveClaims.claimRole,
          expected: 'authenticated',
          passed: liveClaims.claimRole === 'authenticated',
        },
        {
          title: 'Issuer (iss)',
          actual: liveClaims.claimIss,
          expected: 'Valid Clerk Issuer URL',
          passed: Boolean(liveClaims.claimIss && liveClaims.claimIss.length > 5),
        },
        {
          title: 'Expiry (exp)',
          actual: formattedExp,
          expected: 'Future Timestamp',
          passed: isExpValid,
        },
      ];

      const allPassed = checks.every((c) => c.passed);

      setResult({
        claims: liveClaims,
        profileResult: liveProfile,
        checks,
        allPassed,
      });

      toast.success('Live JWT claims & RLS verification completed.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown verification error';
      toast.error(`Inspection failed: ${message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">Clerk ↔ Supabase Live JWT Claims Inspector</CardTitle>
            {result && (
              <Badge variant={result.allPassed ? 'default' : 'destructive'} className="ml-2">
                {result.allPassed ? 'ALL VERIFICATIONS PASSED' : 'VERIFICATION FAILED'}
              </Badge>
            )}
          </div>
          <CardDescription>
            Calls PostgreSQL RPC <code className="font-mono text-xs">public.inspect_clerk_jwt_claims()</code> with your live Clerk session token to verify RLS compatibility.
          </CardDescription>
        </div>
        <Button onClick={runInspection} disabled={isRunning || !isSignedIn} size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Inspecting...' : 'Inspect Live JWT'}
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {!isSignedIn ? (
          <div className="p-4 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 flex items-center gap-3 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>You must be signed in with a Clerk session to inspect JWT claims in the browser.</span>
          </div>
        ) : !result ? (
          <p className="text-sm text-muted-foreground py-2">
            Click <strong>Inspect Live JWT</strong> above to execute the verification against your current session ({clerkEmail}).
          </p>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Claim</TableHead>
                    <TableHead>Expected Value</TableHead>
                    <TableHead>Actual Value (Postgres)</TableHead>
                    <TableHead className="w-[100px] text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.checks.map((check) => (
                    <TableRow key={check.title}>
                      <TableCell className="font-medium text-xs">{check.title}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{check.expected}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold">{check.actual ?? 'null'}</TableCell>
                      <TableCell className="text-right">
                        {check.passed ? (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 gap-1 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <XCircle className="w-3.5 h-3.5" /> FAIL
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Profile & RLS Lookup Verification */}
            <div className="rounded-lg bg-muted/40 p-4 border space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                PostgreSQL RLS Profile Query Verification
              </h4>
              <div className="flex items-center justify-between text-sm">
                <span>Direct query to <code className="font-mono text-xs">public.profiles</code> via RLS:</span>
                {result.profileResult ? (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Profile Found ({result.profileResult.role})
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    No Profile Yet (First-time Purchaser / Onboarding State)
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### 21. `src/features/dev/pages/DesignSystemPage.tsx`

```typescript
import { useState } from "react";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "@/components/shared/DataTable";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { DataTableSkeleton } from "@/components/skeletons/DataTableSkeleton";
import { EmployeeCardSkeleton } from "@/components/skeletons/EmployeeCardSkeleton";
import { FormSkeleton } from "@/components/skeletons/FormSkeleton";
import { ApiErrorState } from "@/components/feedback/ApiErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";
import { toast } from "@/lib/toast";
import { JwtClaimsInspector } from "@/features/dev/components/JwtClaimsInspector";

export default function DesignSystemPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);

  const handleSimulateDelete = () => {
    setDialogLoading(true);
    setTimeout(() => {
      setDialogLoading(false);
      setDialogOpen(false);
      toast.success("Employee deleted successfully");
    }, 2000);
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Internal QA Dashboard" 
        description="Comprehensive testing for typography, components, animations, and error states."
        actions={<Button onClick={() => toast.success("Tests loaded")}>Run Tests</Button>}
      />

      <div className="grid gap-12">
        {/* Live Clerk ↔ Supabase JWT Claims Verification */}
        <section className="space-y-4">
          <JwtClaimsInspector />
        </section>
        {/* Typography */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Typography</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Heading 1</h1>
              <h2 className="text-3xl font-semibold tracking-tight first:mt-0">Heading 2</h2>
              <h3 className="text-2xl font-semibold tracking-tight">Heading 3</h3>
              <h4 className="text-xl font-semibold tracking-tight">Heading 4</h4>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                Paragraph. The quick brown fox jumps over the lazy dog. We use Inter for
                excellent legibility at small sizes and crisp rendering on high-DPI screens.
              </p>
              <p className="text-sm text-muted-foreground">Small text for captions and hints.</p>
            </CardContent>
          </Card>
        </section>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Buttons */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Buttons</h2>
            <Card>
              <CardContent className="flex flex-wrap gap-4 p-6">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </CardContent>
            </Card>
          </section>

          {/* Badges / Status */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Status Badges</h2>
            <Card>
              <CardContent className="flex flex-wrap gap-4 p-6 items-center">
                <StatusBadge status="ACTIVE" />
                <StatusBadge status="INVITED" />
                <StatusBadge status="INACTIVE" />
                <StatusBadge status="TERMINATED" />
                <StatusBadge status="PENDING" />
                <StatusBadge status="APPROVED" />
                <StatusBadge status="REJECTED" />
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Inputs */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Form Elements</h2>
          <Card>
            <CardContent className="grid gap-4 p-6 md:grid-cols-2">
              <Input placeholder="Default input field..." />
              <Input disabled placeholder="Disabled input..." />
            </CardContent>
          </Card>
        </section>

        {/* Interactive Modals & Dialogs */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Modals & Dialogs</h2>
          <Card>
            <CardContent className="flex flex-wrap gap-4 p-6">
              <Button onClick={() => setDialogOpen(true)} variant="destructive">
                Open Confirm Dialog
              </Button>

              <ConfirmActionDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title="Are you sure you want to delete this employee?"
                description="This action cannot be undone. All associated attendance and leave records will be permanently removed."
                confirmLabel="Yes, Delete Employee"
                variant="destructive"
                loading={dialogLoading}
                onConfirm={handleSimulateDelete}
              />
            </CardContent>
          </Card>
        </section>

        {/* Empty States */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Empty States</h2>
          <EmptyState
            icon={Users}
            title="No Employees Found"
            description="Get started by creating your first employee profile or invite them via email."
            action={{
              label: "Add Employee",
              onClick: () => toast.info("Add employee clicked"),
            }}
          />
        </section>

        {/* Error States */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Error States</h2>
          <ApiErrorState
            title="Failed to load dashboard metrics"
            message="We were unable to connect to the database. Please check your internet connection or try again."
            onRetry={() => toast.success("Retrying connection...")}
          />
        </section>

        {/* Data Table */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Data Table</h2>
          <DataTable
            headers={
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            }
          >
            <TableRow>
              <TableCell className="font-medium">John Doe</TableCell>
              <TableCell>john@example.com</TableCell>
              <TableCell>Administrator</TableCell>
              <TableCell><StatusBadge status="ACTIVE" /></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Jane Smith</TableCell>
              <TableCell>jane@example.com</TableCell>
              <TableCell>Manager</TableCell>
              <TableCell><StatusBadge status="PENDING" /></TableCell>
            </TableRow>
          </DataTable>
        </section>

        {/* Skeletons Preview */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Skeleton Loaders</h2>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Dashboard Skeleton</h3>
            <DashboardSkeleton />
          </div>
          
          <div className="mt-8 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Employee Card Skeleton</h3>
            <EmployeeCardSkeleton />
          </div>

          <div className="mt-8 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Form Skeleton</h3>
            <FormSkeleton />
          </div>
          
          <div className="mt-8 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Data Table Skeleton</h3>
            <DataTableSkeleton rows={3} columns={4} />
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
```

---

### 22. `src/app/providers/AppProviders.tsx`

```typescript
import type { ReactNode } from 'react';
import { AuthProvider } from './AuthProvider';
import { SupabaseProvider } from '@/lib/supabase';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Root provider hierarchy for PeakHR:
 * ErrorBoundary -> OfflineBanner -> ClerkProvider (AuthProvider) -> SupabaseProvider -> QueryProvider -> ThemeProvider -> TooltipProvider -> UI
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <OfflineBanner />
      <AuthProvider>
        <SupabaseProvider>
          <QueryProvider>
            <ThemeProvider defaultTheme="system" storageKey="hrms-theme">
              <TooltipProvider>
                {children}
                <Toaster position="top-right" richColors />
              </TooltipProvider>
            </ThemeProvider>
          </QueryProvider>
        </SupabaseProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

---

### 23. `src/app/routes/guards/RouteGuard.tsx`

```typescript
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
```

---

### 24. `src/app/routes/index.tsx`

```typescript
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ROUTES } from '@/constants/routes';
import { AuthGuard, GuestGuard, RoleGuard } from './guards/RouteGuard';
import { PageSkeleton } from '@/components/skeletons/PageSkeleton';
import { isDev } from '@/lib/env';

// Layouts
import AuthLayout from '@/app/layouts/AuthLayout';
import DashboardLayout from '@/app/layouts/DashboardLayout';

// Lazy Loaded Pages
const SignInPage = lazy(() => import('@/features/auth/pages/SignInPage'));
const SignUpPage = lazy(() => import('@/features/auth/pages/SignUpPage'));
const PostAuthPage = lazy(() => import('@/features/auth/pages/PostAuthPage'));
const InvitationPage = lazy(() => import('@/features/auth/pages/InvitationPage'));
const CreateCompanyPage = lazy(() => import('@/features/auth/pages/CreateCompanyPage'));
const SubscriptionRequiredPage = lazy(() => import('@/features/core/pages/SubscriptionRequiredPage'));
const AccessSuspendedPage = lazy(() => import('@/features/core/pages/AccessSuspendedPage'));

const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const EmployeesPage = lazy(() => import('@/features/employees/pages/EmployeesPage'));
const AttendancePage = lazy(() => import('@/features/attendance/pages/AttendancePage'));
const LeavesPage = lazy(() => import('@/features/leaves/pages/LeavesPage'));
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'));
const DesignSystemPage = lazy(() => import('@/features/dev/pages/DesignSystemPage'));
const NotFoundPage = lazy(() => import('@/features/core/pages/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('@/features/core/pages/UnauthorizedPage'));

const SuspenseLayout = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },
  // Post-Authentication Gateway
  {
    path: ROUTES.POST_AUTH,
    element: <SuspenseLayout><PostAuthPage /></SuspenseLayout>,
  },
  // Public & Guest Auth Pages
  {
    path: '/',
    element: (
      <GuestGuard>
        <AuthLayout />
      </GuestGuard>
    ),
    children: [
      {
        path: ROUTES.LOGIN,
        element: <SuspenseLayout><SignInPage /></SuspenseLayout>,
      },
      {
        path: ROUTES.REGISTER,
        element: <SuspenseLayout><SignUpPage /></SuspenseLayout>,
      },
    ],
  },
  // Invitation flow (supports both guests and authenticated users)
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: ROUTES.INVITATION,
        element: <SuspenseLayout><InvitationPage /></SuspenseLayout>,
      },
    ],
  },
  // Onboarding & Entitlement Resolution Pages
  {
    path: ROUTES.ONBOARDING_CREATE_COMPANY,
    element: <SuspenseLayout><CreateCompanyPage /></SuspenseLayout>,
  },
  {
    path: ROUTES.SUBSCRIPTION_REQUIRED,
    element: <SuspenseLayout><SubscriptionRequiredPage /></SuspenseLayout>,
  },
  {
    path: ROUTES.ACCESS_SUSPENDED,
    element: <SuspenseLayout><AccessSuspendedPage /></SuspenseLayout>,
  },
  // Protected Dashboard Application
  {
    path: '/',
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: ROUTES.DASHBOARD,
        element: <SuspenseLayout><DashboardPage /></SuspenseLayout>,
      },
      {
        path: ROUTES.EMPLOYEES,
        element: (
          <RoleGuard roles={['super_admin', 'company_admin', 'manager']}>
            <SuspenseLayout><EmployeesPage /></SuspenseLayout>
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.ATTENDANCE,
        element: (
          <RoleGuard roles={['super_admin', 'company_admin', 'manager', 'employee']}>
            <SuspenseLayout><AttendancePage /></SuspenseLayout>
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.LEAVES,
        element: (
          <RoleGuard roles={['super_admin', 'company_admin', 'manager', 'employee']}>
            <SuspenseLayout><LeavesPage /></SuspenseLayout>
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.SETTINGS,
        element: (
          <RoleGuard roles={['super_admin', 'company_admin']}>
            <SuspenseLayout><SettingsPage /></SuspenseLayout>
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.UNAUTHORIZED,
        element: <SuspenseLayout><UnauthorizedPage /></SuspenseLayout>,
      },
    ],
  },
  ...(isDev
    ? [
        {
          path: ROUTES.DESIGN_SYSTEM,
          element: <SuspenseLayout><DesignSystemPage /></SuspenseLayout>,
        },
      ]
    : []),
  {
    path: '*',
    element: <SuspenseLayout><NotFoundPage /></SuspenseLayout>,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
```

---

### 25. `src/app/layouts/DashboardLayout/UserNav.tsx`

```typescript
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { LogOut, Settings, User } from 'lucide-react';

export function UserNav() {
  const { clerkUser, role } = useCurrentUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const email = clerkUser?.primaryEmailAddress?.emailAddress || 'user@indianbusinesskit.com';
  const name = clerkUser?.fullName || clerkUser?.firstName || email.split('@')[0];
  const initials = name.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-1 ring-border">
          <Avatar className="h-9 w-9">
            <AvatarImage src={clerkUser?.imageUrl || ''} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">{email}</p>
            {role && (
              <span className="inline-block mt-1 text-[10px] font-semibold tracking-wider uppercase text-primary">
                {role.replace('_', ' ')}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(ROUTES.SETTINGS)}>
          <User className="w-4 h-4 mr-2" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(ROUTES.SETTINGS)}>
          <Settings className="w-4 h-4 mr-2" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="w-4 h-4 mr-2" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```
