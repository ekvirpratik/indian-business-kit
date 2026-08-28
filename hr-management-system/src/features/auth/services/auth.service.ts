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
