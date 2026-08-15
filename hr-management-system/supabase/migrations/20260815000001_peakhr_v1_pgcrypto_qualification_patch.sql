-- ===================================================================
-- PeakHR SMB V1 — Corrective Patch: Schema-Qualify pgcrypto Functions
-- ===================================================================
-- Migration: 20260815000001_peakhr_v1_pgcrypto_qualification_patch.sql
-- Purpose: Schema-qualify extensions.gen_random_bytes and extensions.digest
--          in SECURITY DEFINER functions with SET search_path = public, pg_temp
-- ===================================================================

-- 1. create_employee_and_invite (Service-Role ONLY)
CREATE OR REPLACE FUNCTION public.create_employee_and_invite(
    p_actor_clerk_id   TEXT,
    p_full_name        TEXT,
    p_email            TEXT,
    p_phone            TEXT DEFAULT NULL,
    p_position         TEXT DEFAULT NULL,
    p_department_id    UUID DEFAULT NULL,
    p_role             TEXT DEFAULT 'employee',
    p_employee_code    TEXT DEFAULT NULL,
    p_date_of_joining  DATE DEFAULT NULL
)
RETURNS TABLE (
    out_employee_id     UUID,
    out_invitation_id   UUID,
    out_raw_token       TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor_profile     RECORD;
    v_owner_clerk_id    TEXT;
    v_employee_id       UUID;
    v_invitation_id     UUID;
    v_raw_token         TEXT;
    v_token_hash        TEXT;
BEGIN
    IF p_actor_clerk_id IS NULL OR trim(p_actor_clerk_id) = '' THEN
        RAISE EXCEPTION 'Actor Clerk ID is required';
    END IF;

    SELECT p.id, p.company_id, p.role, p.is_active
    INTO v_actor_profile
    FROM public.profiles p
    WHERE p.clerk_user_id = p_actor_clerk_id;

    IF v_actor_profile IS NULL THEN
        RAISE EXCEPTION 'Actor profile not found for clerk_user_id: %', p_actor_clerk_id;
    END IF;

    IF v_actor_profile.role != 'company_admin' THEN
        RAISE EXCEPTION 'Only company administrators can create employees and send invitations (current role: %)', v_actor_profile.role;
    END IF;

    IF NOT v_actor_profile.is_active THEN
        RAISE EXCEPTION 'Actor profile is inactive';
    END IF;

    IF v_actor_profile.company_id IS NULL THEN
        RAISE EXCEPTION 'Actor does not belong to any company';
    END IF;

    SELECT c.owner_clerk_id INTO v_owner_clerk_id
    FROM public.companies c
    WHERE c.id = v_actor_profile.company_id
      AND c.status = 'active';

    IF v_owner_clerk_id IS NULL THEN
        RAISE EXCEPTION 'Company not found or is not active';
    END IF;

    IF NOT public._has_active_platform_membership(v_owner_clerk_id) THEN
        RAISE EXCEPTION 'Active PeakHR membership required';
    END IF;

    IF p_role NOT IN ('manager', 'employee') THEN
        RAISE EXCEPTION 'Invalid role. Must be manager or employee';
    END IF;

    IF p_role = 'manager' AND p_department_id IS NULL THEN
        RAISE EXCEPTION 'A department is required when creating a manager';
    END IF;

    IF p_department_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.departments d
            WHERE d.id = p_department_id
              AND d.company_id = v_actor_profile.company_id
              AND d.is_active
        ) THEN
            RAISE EXCEPTION 'Department not found in your company or is inactive';
        END IF;
    END IF;

    INSERT INTO public.employees (
        company_id, department_id, full_name, email, phone,
        position, employee_code, date_of_joining, status
    ) VALUES (
        v_actor_profile.company_id, p_department_id, p_full_name, p_email, p_phone,
        p_position, p_employee_code, p_date_of_joining, 'INVITED'
    )
    RETURNING id INTO v_employee_id;

    v_raw_token := encode(extensions.gen_random_bytes(32), 'hex');
    v_token_hash := encode(extensions.digest(v_raw_token, 'sha256'), 'hex');

    INSERT INTO public.invitations (
        company_id, employee_id, email, role,
        token_hash, status, email_status,
        invited_by, expires_at
    ) VALUES (
        v_actor_profile.company_id, v_employee_id, p_email, p_role,
        v_token_hash, 'PENDING', 'PENDING',
        p_actor_clerk_id, now() + INTERVAL '7 days'
    )
    RETURNING id INTO v_invitation_id;

    RETURN QUERY SELECT v_employee_id, v_invitation_id, v_raw_token;
END;
$$;

ALTER FUNCTION public.create_employee_and_invite(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, DATE) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.create_employee_and_invite(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, DATE) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_employee_and_invite(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, DATE) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_employee_and_invite(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, DATE) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_employee_and_invite(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, DATE) TO service_role;


-- 2. resend_invitation (Service-Role ONLY)
CREATE OR REPLACE FUNCTION public.resend_invitation(
    p_actor_clerk_id TEXT,
    p_employee_id    UUID
)
RETURNS TABLE (
    out_invitation_id UUID,
    out_raw_token     TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor_profile     RECORD;
    v_owner_clerk_id    TEXT;
    v_invitation_id     UUID;
    v_raw_token         TEXT;
    v_token_hash        TEXT;
    v_emp_company       UUID;
    v_emp_email         TEXT;
    v_emp_status        TEXT;
    v_inv_role          TEXT;
BEGIN
    IF p_actor_clerk_id IS NULL OR trim(p_actor_clerk_id) = '' THEN
        RAISE EXCEPTION 'Actor Clerk ID is required';
    END IF;

    SELECT p.id, p.company_id, p.role, p.is_active
    INTO v_actor_profile
    FROM public.profiles p
    WHERE p.clerk_user_id = p_actor_clerk_id;

    IF v_actor_profile IS NULL THEN
        RAISE EXCEPTION 'Actor profile not found for clerk_user_id: %', p_actor_clerk_id;
    END IF;

    IF v_actor_profile.role != 'company_admin' THEN
        RAISE EXCEPTION 'Only company administrators can resend invitations';
    END IF;

    IF NOT v_actor_profile.is_active THEN
        RAISE EXCEPTION 'Actor profile is inactive';
    END IF;

    IF v_actor_profile.company_id IS NULL THEN
        RAISE EXCEPTION 'Actor does not belong to any company';
    END IF;

    SELECT c.owner_clerk_id INTO v_owner_clerk_id
    FROM public.companies c
    WHERE c.id = v_actor_profile.company_id
      AND c.status = 'active';

    IF v_owner_clerk_id IS NULL THEN
        RAISE EXCEPTION 'Company not found or is not active';
    END IF;

    IF NOT public._has_active_platform_membership(v_owner_clerk_id) THEN
        RAISE EXCEPTION 'Active PeakHR membership required';
    END IF;

    SELECT e.company_id, e.email, e.status
    INTO v_emp_company, v_emp_email, v_emp_status
    FROM public.employees e
    WHERE e.id = p_employee_id AND e.deleted_at IS NULL;

    IF v_emp_company IS NULL OR v_emp_company != v_actor_profile.company_id THEN
        RAISE EXCEPTION 'Employee not found in your company';
    END IF;

    IF v_emp_status != 'INVITED' THEN
        RAISE EXCEPTION 'Employee is not in INVITED status (current: %)', v_emp_status;
    END IF;

    SELECT i.role INTO v_inv_role
    FROM public.invitations i
    WHERE i.employee_id = p_employee_id
      AND i.company_id = v_actor_profile.company_id
    ORDER BY i.created_at DESC
    LIMIT 1;

    v_inv_role := COALESCE(v_inv_role, 'employee');

    UPDATE public.invitations
    SET status = 'REVOKED', updated_at = now()
    WHERE employee_id = p_employee_id
      AND company_id = v_actor_profile.company_id
      AND status = 'PENDING';

    v_raw_token := encode(extensions.gen_random_bytes(32), 'hex');
    v_token_hash := encode(extensions.digest(v_raw_token, 'sha256'), 'hex');

    INSERT INTO public.invitations (
        company_id, employee_id, email, role,
        token_hash, status, email_status,
        invited_by, expires_at
    ) VALUES (
        v_actor_profile.company_id, p_employee_id, v_emp_email, v_inv_role,
        v_token_hash, 'PENDING', 'PENDING',
        p_actor_clerk_id, now() + INTERVAL '7 days'
    )
    RETURNING id INTO v_invitation_id;

    RETURN QUERY SELECT v_invitation_id, v_raw_token;
END;
$$;

ALTER FUNCTION public.resend_invitation(TEXT, UUID) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.resend_invitation(TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.resend_invitation(TEXT, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.resend_invitation(TEXT, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.resend_invitation(TEXT, UUID) TO service_role;


-- 3. validate_invitation (Guest Accessible)
CREATE OR REPLACE FUNCTION public.validate_invitation(
    p_raw_token TEXT
)
RETURNS TABLE (
    out_company_name    TEXT,
    out_masked_email    TEXT,
    out_role            TEXT,
    out_is_valid        BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_token_hash    TEXT;
    v_company_name  TEXT;
    v_email         TEXT;
    v_role          TEXT;
    v_status        TEXT;
    v_expires_at    TIMESTAMPTZ;
    v_local_part    TEXT;
BEGIN
    v_token_hash := encode(extensions.digest(p_raw_token, 'sha256'), 'hex');

    SELECT i.email, i.role, i.status, i.expires_at, c.name
    INTO v_email, v_role, v_status, v_expires_at, v_company_name
    FROM public.invitations i
    JOIN public.companies c ON c.id = i.company_id
    WHERE i.token_hash = v_token_hash;

    IF v_email IS NULL THEN
        RETURN QUERY SELECT NULL::TEXT, NULL::TEXT, NULL::TEXT, FALSE;
        RETURN;
    END IF;

    IF v_status != 'PENDING' OR v_expires_at < now() THEN
        RETURN QUERY SELECT v_company_name, NULL::TEXT, v_role, FALSE;
        RETURN;
    END IF;

    v_local_part := split_part(v_email, '@', 1);
    RETURN QUERY SELECT
        v_company_name,
        CASE
            WHEN length(v_local_part) <= 2 THEN
                left(v_local_part, 1) || '***@' || split_part(v_email, '@', 2)
            ELSE
                left(v_local_part, 1) || '***' || right(v_local_part, 1)
                || '@' || split_part(v_email, '@', 2)
        END,
        v_role,
        TRUE;
END;
$$;

ALTER FUNCTION public.validate_invitation(TEXT) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.validate_invitation(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_invitation(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_invitation(TEXT) TO authenticated;


-- 4. accept_invitation (Authenticated Member)
CREATE OR REPLACE FUNCTION public.accept_invitation(
    p_raw_token TEXT,
    p_full_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clerk_id          TEXT;
    v_clerk_email       TEXT;
    v_token_hash        TEXT;
    v_invitation        RECORD;
    v_profile_id        UUID;
    v_existing_profile  UUID;
BEGIN
    v_clerk_id := auth.jwt() ->> 'sub';
    v_clerk_email := auth.jwt() ->> 'email';

    IF v_clerk_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF v_clerk_email IS NULL THEN
        RAISE EXCEPTION 'Trusted email claim unavailable. Cannot verify invitation binding.';
    END IF;

    SELECT id INTO v_existing_profile
    FROM public.profiles
    WHERE clerk_user_id = v_clerk_id;

    IF v_existing_profile IS NOT NULL THEN
        RAISE EXCEPTION 'An existing PeakHR profile cannot accept another invitation. Contact your administrator.';
    END IF;

    v_token_hash := encode(extensions.digest(p_raw_token, 'sha256'), 'hex');

    SELECT
        i.*,
        e.company_id AS emp_company_id,
        e.status AS emp_status,
        c.status AS company_status,
        c.owner_clerk_id
    INTO v_invitation
    FROM public.invitations i
    JOIN public.employees e ON e.id = i.employee_id
    JOIN public.companies c ON c.id = e.company_id
    WHERE i.token_hash = v_token_hash;

    IF v_invitation IS NULL THEN
        RAISE EXCEPTION 'Invalid invitation token';
    END IF;

    IF v_invitation.status != 'PENDING' THEN
        RAISE EXCEPTION 'Invitation is no longer pending (status: %)', v_invitation.status;
    END IF;

    IF v_invitation.expires_at < now() THEN
        UPDATE public.invitations SET status = 'EXPIRED', updated_at = now()
        WHERE id = v_invitation.id;
        RAISE EXCEPTION 'Invitation has expired';
    END IF;

    IF lower(v_clerk_email) != lower(v_invitation.email) THEN
        RAISE EXCEPTION 'Email mismatch: your account email does not match the invitation';
    END IF;

    IF v_invitation.emp_status != 'INVITED' THEN
        RAISE EXCEPTION 'Employee record is not in INVITED status (current: %)', v_invitation.emp_status;
    END IF;

    IF v_invitation.company_status != 'active' THEN
        RAISE EXCEPTION 'Company is not active (status: %). Cannot accept invitation.', v_invitation.company_status;
    END IF;

    IF NOT public._has_active_platform_membership(v_invitation.owner_clerk_id) THEN
        RAISE EXCEPTION 'Company membership has expired. Cannot accept invitation.';
    END IF;

    INSERT INTO public.profiles (
        clerk_user_id, email, full_name,
        company_id, employee_id, role, is_active
    ) VALUES (
        v_clerk_id,
        v_clerk_email,
        COALESCE(p_full_name, split_part(v_clerk_email, '@', 1)),
        v_invitation.emp_company_id,
        v_invitation.employee_id,
        v_invitation.role,
        true
    )
    RETURNING id INTO v_profile_id;

    UPDATE public.invitations
    SET status = 'ACCEPTED', updated_at = now()
    WHERE id = v_invitation.id;

    UPDATE public.employees
    SET status = 'ACTIVE', updated_at = now()
    WHERE id = v_invitation.employee_id;

    RETURN v_profile_id;
END;
$$;

ALTER FUNCTION public.accept_invitation(TEXT, TEXT) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.accept_invitation(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_invitation(TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT, TEXT) TO authenticated;


-- 5. reject_invitation (Guest Accessible)
CREATE OR REPLACE FUNCTION public.reject_invitation(
    p_raw_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_token_hash    TEXT;
    v_invitation_id UUID;
BEGIN
    v_token_hash := encode(extensions.digest(p_raw_token, 'sha256'), 'hex');

    SELECT i.id INTO v_invitation_id
    FROM public.invitations i
    WHERE i.token_hash = v_token_hash
      AND i.status = 'PENDING'
      AND i.expires_at > now();

    IF v_invitation_id IS NULL THEN
        RETURN FALSE;
    END IF;

    UPDATE public.invitations
    SET status = 'CANCELLED', updated_at = now()
    WHERE id = v_invitation_id;

    RETURN TRUE;
END;
$$;

ALTER FUNCTION public.reject_invitation(TEXT) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.reject_invitation(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_invitation(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.reject_invitation(TEXT) TO authenticated;
