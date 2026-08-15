    -- ===================================================================
    -- PeakHR SMB V1 — Full Schema & Security Architecture Migration (v11)
    -- ===================================================================
    -- Target Database: Supabase PostgreSQL
    -- Auth Integration: Clerk Third-Party Native JWT Auth
    -- Multi-Tenancy: Shared database, tenant isolated by company_id via RLS
    -- Security Definer Search Path: public, pg_temp
    -- ===================================================================

    -- Enable pgcrypto for UUIDs and SHA-256 hashing
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- ===================================================================
    -- 1. TABLES & CONSTRAINTS
    -- ===================================================================

    -- 1.1 Companies (Tenants)
    CREATE TABLE IF NOT EXISTS public.companies (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name            TEXT NOT NULL,
        owner_clerk_id  TEXT NOT NULL,
        status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
        timezone        TEXT NOT NULL DEFAULT 'Asia/Kolkata',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- One company per paying member
    CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_owner_clerk_id
        ON public.companies(owner_clerk_id);

    -- 1.2 Departments
    CREATE TABLE IF NOT EXISTS public.departments (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
        name        TEXT NOT NULL,
        is_active   BOOLEAN NOT NULL DEFAULT true,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_departments_company_id
        ON public.departments(company_id);

    -- Case-insensitive uniqueness for department name per company
    CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_company_name_ci
        ON public.departments(company_id, lower(name));

    -- 1.3 Employees
    CREATE TABLE IF NOT EXISTS public.employees (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
        department_id   UUID REFERENCES public.departments(id) ON DELETE RESTRICT,
        employee_code   TEXT,
        full_name       TEXT NOT NULL,
        email           TEXT NOT NULL,
        phone           TEXT,
        position        TEXT,
        date_of_joining DATE,
        status          TEXT NOT NULL DEFAULT 'INVITED' CHECK (status IN ('INVITED', 'ACTIVE', 'INACTIVE', 'TERMINATED')),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at      TIMESTAMPTZ DEFAULT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_employees_company_id
        ON public.employees(company_id);
    CREATE INDEX IF NOT EXISTS idx_employees_department_id
        ON public.employees(department_id);

    -- Case-insensitive unique employee email per company for non-deleted employees
    CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_company_email_active
        ON public.employees(company_id, lower(email))
        WHERE deleted_at IS NULL;

    -- Case-insensitive unique employee code per company for non-deleted employees
    CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_company_code_active
        ON public.employees(company_id, lower(employee_code))
        WHERE deleted_at IS NULL AND employee_code IS NOT NULL;

    -- 1.4 Profiles (App Users / Clerk Binding)
    CREATE TABLE IF NOT EXISTS public.profiles (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clerk_user_id   TEXT NOT NULL UNIQUE,
        email           TEXT NOT NULL,
        full_name       TEXT,
        avatar_url      TEXT,
        phone           TEXT,
        company_id      UUID REFERENCES public.companies(id) ON DELETE RESTRICT,
        employee_id     UUID UNIQUE REFERENCES public.employees(id) ON DELETE RESTRICT,
        role            TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('super_admin', 'company_admin', 'manager', 'employee')),
        is_active       BOOLEAN NOT NULL DEFAULT true,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT chk_super_admin_no_company CHECK (
            (role = 'super_admin' AND company_id IS NULL AND employee_id IS NULL)
            OR
            (role != 'super_admin' AND company_id IS NOT NULL)
        ),
        CONSTRAINT chk_company_admin_no_employee CHECK (
            (role = 'company_admin' AND employee_id IS NULL)
            OR
            (role IN ('manager', 'employee') AND employee_id IS NOT NULL)
            OR
            (role = 'super_admin')
        )
    );

    CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id
        ON public.profiles(clerk_user_id);
    CREATE INDEX IF NOT EXISTS idx_profiles_company_id
        ON public.profiles(company_id);
    CREATE INDEX IF NOT EXISTS idx_profiles_employee_id
        ON public.profiles(employee_id);

    -- 1.5 Invitations
    CREATE TABLE IF NOT EXISTS public.invitations (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
        employee_id     UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
        email           TEXT NOT NULL,
        role            TEXT NOT NULL CHECK (role IN ('manager', 'employee')),
        token_hash      TEXT NOT NULL UNIQUE,
        status          TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'CANCELLED', 'EXPIRED', 'REVOKED')),
        email_status    TEXT NOT NULL DEFAULT 'PENDING' CHECK (email_status IN ('PENDING', 'SENT', 'FAILED')),
        invited_by      TEXT NOT NULL,
        expires_at      TIMESTAMPTZ NOT NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_invitations_company_id
        ON public.invitations(company_id);
    CREATE INDEX IF NOT EXISTS idx_invitations_employee_id
        ON public.invitations(employee_id);
    CREATE INDEX IF NOT EXISTS idx_invitations_token_hash
        ON public.invitations(token_hash);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_one_pending_per_employee
        ON public.invitations(employee_id)
        WHERE status = 'PENDING';

    -- 1.6 Attendance
    CREATE TABLE IF NOT EXISTS public.attendance (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
        employee_id     UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
        attendance_date DATE NOT NULL,
        clock_in        TIMESTAMPTZ NOT NULL,
        clock_out       TIMESTAMPTZ,
        status          TEXT NOT NULL DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'HALF_DAY')),
        notes           TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_attendance_employee_date UNIQUE (employee_id, attendance_date)
    );

    CREATE INDEX IF NOT EXISTS idx_attendance_company_date
        ON public.attendance(company_id, attendance_date);
    CREATE INDEX IF NOT EXISTS idx_attendance_employee_date
        ON public.attendance(employee_id, attendance_date);

    -- 1.7 Leaves
    CREATE TABLE IF NOT EXISTS public.leaves (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
        employee_id     UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
        leave_type      TEXT NOT NULL CHECK (leave_type IN ('CASUAL', 'SICK', 'PAID', 'UNPAID')),
        start_date      DATE NOT NULL,
        end_date        DATE NOT NULL,
        days_count      INTEGER NOT NULL CHECK (days_count > 0),
        reason          TEXT,
        status          TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
        reviewed_by     TEXT,
        reviewed_at     TIMESTAMPTZ,
        review_notes    TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
    );

    CREATE INDEX IF NOT EXISTS idx_leaves_company_id
        ON public.leaves(company_id);
    CREATE INDEX IF NOT EXISTS idx_leaves_employee_id
        ON public.leaves(employee_id);
    CREATE INDEX IF NOT EXISTS idx_leaves_dates
        ON public.leaves(employee_id, start_date, end_date);

    -- ===================================================================
    -- 2. TRIGGERS (Automated Timestamps & Immutability Protection)
    -- ===================================================================

    CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER set_companies_updated_at
        BEFORE UPDATE ON public.companies
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER set_departments_updated_at
        BEFORE UPDATE ON public.departments
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER set_employees_updated_at
        BEFORE UPDATE ON public.employees
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER set_profiles_updated_at
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER set_invitations_updated_at
        BEFORE UPDATE ON public.invitations
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER set_attendance_updated_at
        BEFORE UPDATE ON public.attendance
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER set_leaves_updated_at
        BEFORE UPDATE ON public.leaves
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

    -- Profile Immutability Trigger (Guards structural and security fields)
    CREATE OR REPLACE FUNCTION public.check_profile_immutable_fields()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.clerk_user_id IS DISTINCT FROM OLD.clerk_user_id THEN
            RAISE EXCEPTION 'clerk_user_id is immutable';
        END IF;
        IF NEW.email IS DISTINCT FROM OLD.email THEN
            RAISE EXCEPTION 'email cannot be changed via direct UPDATE';
        END IF;
        IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
            RAISE EXCEPTION 'company_id is immutable after assignment';
        END IF;
        IF NEW.employee_id IS DISTINCT FROM OLD.employee_id THEN
            RAISE EXCEPTION 'employee_id is immutable after assignment';
        END IF;
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'role cannot be changed via direct UPDATE';
        END IF;
        IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
            RAISE EXCEPTION 'is_active cannot be changed via direct UPDATE';
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_profile_immutability
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.check_profile_immutable_fields();

    -- Company Immutability Trigger (Protects administrative status from direct modification)
    CREATE OR REPLACE FUNCTION public.check_company_immutable_fields()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.id IS DISTINCT FROM OLD.id THEN
            RAISE EXCEPTION 'company id is immutable';
        END IF;
        IF NEW.owner_clerk_id IS DISTINCT FROM OLD.owner_clerk_id THEN
            RAISE EXCEPTION 'owner_clerk_id is immutable';
        END IF;
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'company status cannot be modified through client updates';
        END IF;
        IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'created_at is immutable';
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_company_immutability
        BEFORE UPDATE ON public.companies
        FOR EACH ROW
        EXECUTE FUNCTION public.check_company_immutable_fields();

    -- ===================================================================
    -- 3. CORE CONTEXT & ENTITLEMENT HELPERS (Non-Recursive)
    -- ===================================================================

    -- Auth context helper (SECURITY DEFINER bypasses profiles RLS)
    CREATE OR REPLACE FUNCTION public.get_my_auth_context()
    RETURNS TABLE (
        ctx_clerk_id        TEXT,
        ctx_company_id      UUID,
        ctx_role            TEXT,
        ctx_employee_id     UUID,
        ctx_department_id   UUID,
        ctx_is_active       BOOLEAN
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    STABLE
    SET search_path = public, pg_temp
    AS $$
    DECLARE
        v_clerk_id TEXT;
    BEGIN
        v_clerk_id := auth.jwt() ->> 'sub';

        IF v_clerk_id IS NULL THEN
            RETURN;
        END IF;

        RETURN QUERY
        SELECT
            p.clerk_user_id,
            p.company_id,
            p.role,
            p.employee_id,
            e.department_id,
            p.is_active
        FROM public.profiles p
        LEFT JOIN public.employees e ON e.id = p.employee_id
        WHERE p.clerk_user_id = v_clerk_id
        LIMIT 1;
    END;
    $$;

    ALTER FUNCTION public.get_my_auth_context() OWNER TO postgres;
    REVOKE EXECUTE ON FUNCTION public.get_my_auth_context() FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.get_my_auth_context() FROM anon;
    GRANT EXECUTE ON FUNCTION public.get_my_auth_context() TO authenticated;

    -- Private platform membership check (Real subscriptions table columns: active, expires_at)
    CREATE OR REPLACE FUNCTION public._has_active_platform_membership(
        p_clerk_user_id TEXT
    )
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER
    STABLE
    SET search_path = public, pg_temp
    AS $$
    BEGIN
        RETURN EXISTS (
            SELECT 1
            FROM public.subscriptions s
            WHERE s.user_id = p_clerk_user_id
            AND s.active = true
            AND s.expires_at > now()
        );
    END;
    $$;

    ALTER FUNCTION public._has_active_platform_membership(TEXT) OWNER TO postgres;
    REVOKE EXECUTE ON FUNCTION public._has_active_platform_membership(TEXT) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public._has_active_platform_membership(TEXT) FROM anon;
    REVOKE EXECUTE ON FUNCTION public._has_active_platform_membership(TEXT) FROM authenticated;

    -- Parameterless current-user entitlement helper (checks profile active state, company status, owner membership)
    CREATE OR REPLACE FUNCTION public._is_entitled()
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER
    STABLE
    SET search_path = public, pg_temp
    AS $$
    DECLARE
        v_company_id     UUID;
        v_is_active      BOOLEAN;
        v_owner_clerk_id TEXT;
    BEGIN
        SELECT ctx.ctx_company_id, ctx.ctx_is_active
        INTO v_company_id, v_is_active
        FROM public.get_my_auth_context() ctx;

        -- Inactive profile OR no company -> immediately unentitled
        IF v_company_id IS NULL OR v_is_active IS NOT TRUE THEN
            RETURN FALSE;
        END IF;

        SELECT c.owner_clerk_id INTO v_owner_clerk_id
        FROM public.companies c
        WHERE c.id = v_company_id
        AND c.status = 'active';

        IF v_owner_clerk_id IS NULL THEN
            RETURN FALSE;
        END IF;

        RETURN public._has_active_platform_membership(v_owner_clerk_id);
    END;
    $$;

    ALTER FUNCTION public._is_entitled() OWNER TO postgres;
    REVOKE EXECUTE ON FUNCTION public._is_entitled() FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public._is_entitled() FROM anon;
    GRANT EXECUTE ON FUNCTION public._is_entitled() TO authenticated;

    -- ===================================================================
    -- 4. TRUSTED BUSINESS RPCS
    -- ===================================================================

    -- 4.1 Create Company + Admin Profile
    CREATE OR REPLACE FUNCTION public.create_company_and_admin_profile(
        p_company_name  TEXT,
        p_timezone      TEXT DEFAULT 'Asia/Kolkata'
    )
    RETURNS UUID
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
    DECLARE
        v_clerk_id          TEXT;
        v_clerk_email       TEXT;
        v_company_id        UUID;
        v_existing_profile  UUID;
        v_normalized_tz     TEXT;
    BEGIN
        v_clerk_id := auth.jwt() ->> 'sub';
        v_clerk_email := auth.jwt() ->> 'email';

        IF v_clerk_id IS NULL THEN
            RAISE EXCEPTION 'Authentication required';
        END IF;

        IF v_clerk_email IS NULL THEN
            RAISE EXCEPTION 'Trusted email claim unavailable';
        END IF;

        IF NOT public._has_active_platform_membership(v_clerk_id) THEN
            RAISE EXCEPTION 'Active Indian Business Kit membership required';
        END IF;

        -- Normalize timezone: blank/whitespace/null defaults to 'Asia/Kolkata'
        v_normalized_tz := COALESCE(NULLIF(trim(p_timezone), ''), 'Asia/Kolkata');

        -- Validate normalized timezone against pg_timezone_names
        IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = v_normalized_tz) THEN
            RAISE EXCEPTION 'Invalid timezone: %. Must be a valid PostgreSQL timezone name.', v_normalized_tz;
        END IF;

        SELECT id INTO v_existing_profile
        FROM public.profiles
        WHERE clerk_user_id = v_clerk_id;

        IF v_existing_profile IS NOT NULL THEN
            RAISE EXCEPTION 'User already has a PeakHR profile. Cannot create a company.';
        END IF;

        INSERT INTO public.companies (name, owner_clerk_id, timezone)
        VALUES (p_company_name, v_clerk_id, v_normalized_tz)
        RETURNING id INTO v_company_id;

        INSERT INTO public.profiles (
            clerk_user_id, email, full_name, company_id, role, is_active
        ) VALUES (
            v_clerk_id, v_clerk_email,
            split_part(v_clerk_email, '@', 1),
            v_company_id, 'company_admin', true
        );

        RETURN v_company_id;
    END;
    $$;

    ALTER FUNCTION public.create_company_and_admin_profile(TEXT, TEXT) OWNER TO postgres;
    REVOKE EXECUTE ON FUNCTION public.create_company_and_admin_profile(TEXT, TEXT) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.create_company_and_admin_profile(TEXT, TEXT) FROM anon;
    GRANT EXECUTE ON FUNCTION public.create_company_and_admin_profile(TEXT, TEXT) TO authenticated;

    -- 4.2 Create Employee + Invitation (Service-Role ONLY)
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

    -- 4.3 Resend Invitation (Service-Role ONLY)
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

    -- 4.4 Validate Invitation (Guest / Masked Email)
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

    -- 4.5 Accept Invitation
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

    -- 4.6 Reject Invitation
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

    -- 4.7 Clock In
    CREATE OR REPLACE FUNCTION public.clock_in(
        p_notes TEXT DEFAULT NULL
    )
    RETURNS UUID
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
    DECLARE
        v_ctx           RECORD;
        v_company_tz    TEXT;
        v_local_date    DATE;
        v_attendance_id UUID;
        v_emp_status    TEXT;
        v_emp_deleted   TIMESTAMPTZ;
    BEGIN
        SELECT * INTO v_ctx FROM public.get_my_auth_context() ctx;

        IF v_ctx.ctx_employee_id IS NULL THEN
            RAISE EXCEPTION 'Only employees can clock in';
        END IF;

        IF NOT public._is_entitled() THEN
            RAISE EXCEPTION 'Active PeakHR membership required';
        END IF;

        SELECT e.status, e.deleted_at INTO v_emp_status, v_emp_deleted
        FROM public.employees e WHERE e.id = v_ctx.ctx_employee_id;

        IF v_emp_status != 'ACTIVE' OR v_emp_deleted IS NOT NULL THEN
            RAISE EXCEPTION 'Employee record is not active';
        END IF;

        SELECT c.timezone INTO v_company_tz
        FROM public.companies c WHERE c.id = v_ctx.ctx_company_id;

        v_local_date := (now() AT TIME ZONE COALESCE(v_company_tz, 'Asia/Kolkata'))::DATE;

        INSERT INTO public.attendance (
            company_id, employee_id, attendance_date,
            clock_in, status, notes
        ) VALUES (
            v_ctx.ctx_company_id, v_ctx.ctx_employee_id,
            v_local_date, now(), 'PRESENT', p_notes
        )
        RETURNING id INTO v_attendance_id;

        RETURN v_attendance_id;
    EXCEPTION
        WHEN unique_violation THEN
            RAISE EXCEPTION 'Already clocked in for today (%)' , v_local_date;
    END;
    $$;

    ALTER FUNCTION public.clock_in(TEXT) OWNER TO postgres;
    REVOKE EXECUTE ON FUNCTION public.clock_in(TEXT) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.clock_in(TEXT) FROM anon;
    GRANT EXECUTE ON FUNCTION public.clock_in(TEXT) TO authenticated;

    -- 4.8 Clock Out
    CREATE OR REPLACE FUNCTION public.clock_out()
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
    DECLARE
        v_ctx           RECORD;
        v_company_tz    TEXT;
        v_local_date    DATE;
        v_emp_status    TEXT;
        v_emp_deleted   TIMESTAMPTZ;
        v_updated       INT;
    BEGIN
        SELECT * INTO v_ctx FROM public.get_my_auth_context() ctx;

        IF v_ctx.ctx_employee_id IS NULL THEN
            RAISE EXCEPTION 'Only employees can clock out';
        END IF;

        IF NOT public._is_entitled() THEN
            RAISE EXCEPTION 'Active PeakHR membership required';
        END IF;

        SELECT e.status, e.deleted_at INTO v_emp_status, v_emp_deleted
        FROM public.employees e WHERE e.id = v_ctx.ctx_employee_id;

        IF v_emp_status != 'ACTIVE' OR v_emp_deleted IS NOT NULL THEN
            RAISE EXCEPTION 'Employee record is not active';
        END IF;

        SELECT c.timezone INTO v_company_tz
        FROM public.companies c WHERE c.id = v_ctx.ctx_company_id;

        v_local_date := (now() AT TIME ZONE COALESCE(v_company_tz, 'Asia/Kolkata'))::DATE;

        UPDATE public.attendance
        SET clock_out = now(), updated_at = now()
        WHERE company_id = v_ctx.ctx_company_id
        AND employee_id = v_ctx.ctx_employee_id
        AND attendance_date = v_local_date
        AND clock_out IS NULL;

        GET DIAGNOSTICS v_updated = ROW_COUNT;

        IF v_updated = 0 THEN
            RAISE EXCEPTION 'No open clock-in found for today';
        END IF;

        RETURN TRUE;
    END;
    $$;

    ALTER FUNCTION public.clock_out() OWNER TO postgres;
    REVOKE EXECUTE ON FUNCTION public.clock_out() FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.clock_out() FROM anon;
    GRANT EXECUTE ON FUNCTION public.clock_out() TO authenticated;

    -- 4.9 Submit Leave Request
    CREATE OR REPLACE FUNCTION public.submit_leave_request(
        p_leave_type    TEXT,
        p_start_date    DATE,
        p_end_date      DATE,
        p_reason        TEXT DEFAULT NULL
    )
    RETURNS UUID
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
    DECLARE
        v_ctx           RECORD;
        v_leave_id      UUID;
        v_emp_status    TEXT;
        v_emp_deleted   TIMESTAMPTZ;
        v_days_count    INT;
        v_lock_key      BIGINT;
    BEGIN
        SELECT * INTO v_ctx FROM public.get_my_auth_context() ctx;

        IF v_ctx.ctx_employee_id IS NULL THEN
            RAISE EXCEPTION 'Only employees can submit leave requests';
        END IF;

        IF NOT public._is_entitled() THEN
            RAISE EXCEPTION 'Active PeakHR membership required';
        END IF;

        SELECT e.status, e.deleted_at INTO v_emp_status, v_emp_deleted
        FROM public.employees e WHERE e.id = v_ctx.ctx_employee_id;

        IF v_emp_status != 'ACTIVE' OR v_emp_deleted IS NOT NULL THEN
            RAISE EXCEPTION 'Employee record is not active';
        END IF;

        IF p_end_date < p_start_date THEN
            RAISE EXCEPTION 'End date must be on or after start date';
        END IF;

        v_days_count := (p_end_date - p_start_date) + 1;

        -- Advisory lock prevents concurrent overlap race condition
        v_lock_key := abs(hashtext(v_ctx.ctx_employee_id::TEXT));
        PERFORM pg_advisory_xact_lock(v_lock_key);

        IF EXISTS (
            SELECT 1 FROM public.leaves l
            WHERE l.employee_id = v_ctx.ctx_employee_id
            AND l.status IN ('PENDING', 'APPROVED')
            AND l.start_date <= p_end_date
            AND l.end_date >= p_start_date
        ) THEN
            RAISE EXCEPTION 'Leave dates overlap with an existing request';
        END IF;

        INSERT INTO public.leaves (
            company_id, employee_id, leave_type,
            start_date, end_date, days_count,
            reason, status
        ) VALUES (
            v_ctx.ctx_company_id, v_ctx.ctx_employee_id, p_leave_type,
            p_start_date, p_end_date, v_days_count,
            p_reason, 'PENDING'
        )
        RETURNING id INTO v_leave_id;

        RETURN v_leave_id;
    END;
    $$;

    ALTER FUNCTION public.submit_leave_request(TEXT, DATE, DATE, TEXT) OWNER TO postgres;
    REVOKE EXECUTE ON FUNCTION public.submit_leave_request(TEXT, DATE, DATE, TEXT) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.submit_leave_request(TEXT, DATE, DATE, TEXT) FROM anon;
    GRANT EXECUTE ON FUNCTION public.submit_leave_request(TEXT, DATE, DATE, TEXT) TO authenticated;

    -- 4.10 Cancel Leave Request
    CREATE OR REPLACE FUNCTION public.cancel_leave_request(
        p_leave_id UUID
    )
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
    DECLARE
        v_ctx   RECORD;
        v_leave RECORD;
    BEGIN
        SELECT * INTO v_ctx FROM public.get_my_auth_context() ctx;

        IF v_ctx.ctx_employee_id IS NULL THEN
            RAISE EXCEPTION 'Only employees can cancel leave requests';
        END IF;

        IF NOT public._is_entitled() THEN
            RAISE EXCEPTION 'Active PeakHR membership required';
        END IF;

        SELECT * INTO v_leave FROM public.leaves l
        WHERE l.id = p_leave_id
        AND l.employee_id = v_ctx.ctx_employee_id
        AND l.company_id = v_ctx.ctx_company_id;

        IF v_leave IS NULL THEN
            RAISE EXCEPTION 'Leave request not found';
        END IF;

        IF v_leave.status != 'PENDING' THEN
            RAISE EXCEPTION 'Only PENDING leave requests can be cancelled';
        END IF;

        UPDATE public.leaves
        SET status = 'CANCELLED', updated_at = now()
        WHERE id = p_leave_id;

        RETURN TRUE;
    END;
    $$;

    ALTER FUNCTION public.cancel_leave_request(UUID) OWNER TO postgres;
    REVOKE EXECUTE ON FUNCTION public.cancel_leave_request(UUID) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.cancel_leave_request(UUID) FROM anon;
    GRANT EXECUTE ON FUNCTION public.cancel_leave_request(UUID) TO authenticated;

    -- 4.11 Review Leave Request
    CREATE OR REPLACE FUNCTION public.review_leave_request(
        p_leave_id      UUID,
        p_decision      TEXT,
        p_review_notes  TEXT DEFAULT NULL
    )
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
    DECLARE
        v_ctx       RECORD;
        v_leave     RECORD;
    BEGIN
        SELECT * INTO v_ctx FROM public.get_my_auth_context() ctx;

        IF v_ctx.ctx_role NOT IN ('company_admin', 'manager') THEN
            RAISE EXCEPTION 'Only administrators and managers can review leave requests';
        END IF;

        IF NOT public._is_entitled() THEN
            RAISE EXCEPTION 'Active PeakHR membership required';
        END IF;

        IF p_decision NOT IN ('APPROVED', 'REJECTED') THEN
            RAISE EXCEPTION 'Decision must be APPROVED or REJECTED';
        END IF;

        SELECT * INTO v_leave FROM public.leaves l
        WHERE l.id = p_leave_id
        AND l.company_id = v_ctx.ctx_company_id
        AND l.status = 'PENDING';

        IF v_leave IS NULL THEN
            RAISE EXCEPTION 'Pending leave request not found in your company';
        END IF;

        IF v_ctx.ctx_role = 'manager' THEN
            IF v_ctx.ctx_department_id IS NULL THEN
                RAISE EXCEPTION 'Manager has no department assignment';
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM public.employees e
                WHERE e.id = v_leave.employee_id
                AND e.department_id = v_ctx.ctx_department_id
            ) THEN
                RAISE EXCEPTION 'Managers can only review leave requests from their own department';
            END IF;
        END IF;

        UPDATE public.leaves
        SET status = p_decision,
            reviewed_by = v_ctx.ctx_clerk_id,
            reviewed_at = now(),
            review_notes = p_review_notes,
            updated_at = now()
        WHERE id = p_leave_id;

        RETURN TRUE;
    END;
    $$;

    ALTER FUNCTION public.review_leave_request(UUID, TEXT, TEXT) OWNER TO postgres;
    REVOKE EXECUTE ON FUNCTION public.review_leave_request(UUID, TEXT, TEXT) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.review_leave_request(UUID, TEXT, TEXT) FROM anon;
    GRANT EXECUTE ON FUNCTION public.review_leave_request(UUID, TEXT, TEXT) TO authenticated;

    -- 4.12 Safe Invitations Metadata List
    CREATE OR REPLACE FUNCTION public.get_company_invitations()
    RETURNS TABLE (
        out_id              UUID,
        out_employee_id     UUID,
        out_email           TEXT,
        out_role            TEXT,
        out_status          TEXT,
        out_email_status    TEXT,
        out_expires_at      TIMESTAMPTZ,
        out_created_at      TIMESTAMPTZ
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    STABLE
    SET search_path = public, pg_temp
    AS $$
    DECLARE
        v_ctx RECORD;
    BEGIN
        SELECT * INTO v_ctx FROM public.get_my_auth_context() ctx;

        IF v_ctx.ctx_role != 'company_admin' THEN
            RAISE EXCEPTION 'Only company administrators can view invitations';
        END IF;

        IF NOT public._is_entitled() THEN
            RAISE EXCEPTION 'Active PeakHR membership required';
        END IF;

        RETURN QUERY
        SELECT
            i.id,
            i.employee_id,
            i.email,
            i.role,
            i.status,
            i.email_status,
            i.expires_at,
            i.created_at
        FROM public.invitations i
        WHERE i.company_id = v_ctx.ctx_company_id
        ORDER BY i.created_at DESC;
    END;
    $$;

    ALTER FUNCTION public.get_company_invitations() OWNER TO postgres;
    REVOKE EXECUTE ON FUNCTION public.get_company_invitations() FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.get_company_invitations() FROM anon;
    GRANT EXECUTE ON FUNCTION public.get_company_invitations() TO authenticated;

    -- 4.13 Update Company Settings
    CREATE OR REPLACE FUNCTION public.update_company_settings(
        p_name      TEXT,
        p_timezone  TEXT DEFAULT 'Asia/Kolkata'
    )
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
    DECLARE
        v_ctx           RECORD;
        v_normalized_tz TEXT;
    BEGIN
        SELECT * INTO v_ctx FROM public.get_my_auth_context() ctx;

        IF v_ctx.ctx_role != 'company_admin' THEN
            RAISE EXCEPTION 'Only company administrators can update company settings';
        END IF;

        IF NOT public._is_entitled() THEN
            RAISE EXCEPTION 'Active PeakHR membership required';
        END IF;

        v_normalized_tz := COALESCE(NULLIF(trim(p_timezone), ''), 'Asia/Kolkata');
        IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = v_normalized_tz) THEN
            RAISE EXCEPTION 'Invalid timezone: %. Must be a valid PostgreSQL timezone name.', v_normalized_tz;
        END IF;

        UPDATE public.companies
        SET name = p_name,
            timezone = v_normalized_tz,
            updated_at = now()
        WHERE id = v_ctx.ctx_company_id;

        RETURN TRUE;
    END;
    $$;

    ALTER FUNCTION public.update_company_settings(TEXT, TEXT) OWNER TO postgres;
    REVOKE EXECUTE ON FUNCTION public.update_company_settings(TEXT, TEXT) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.update_company_settings(TEXT, TEXT) FROM anon;
    GRANT EXECUTE ON FUNCTION public.update_company_settings(TEXT, TEXT) TO authenticated;

    -- 4.14 Mark Invitation Email Status (Service-Role ONLY)
    CREATE OR REPLACE FUNCTION public.mark_invitation_email_status(
        p_invitation_id UUID,
        p_status        TEXT
    )
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
    BEGIN
        IF p_status NOT IN ('SENT', 'FAILED') THEN
            RAISE EXCEPTION 'Invalid email status: %. Must be SENT or FAILED.', p_status;
        END IF;

        UPDATE public.invitations
        SET email_status = p_status,
            updated_at = now()
        WHERE id = p_invitation_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Invitation not found for id: %', p_invitation_id;
        END IF;

        RETURN TRUE;
    END;
    $$;

    ALTER FUNCTION public.mark_invitation_email_status(UUID, TEXT) OWNER TO postgres;
    REVOKE EXECUTE ON FUNCTION public.mark_invitation_email_status(UUID, TEXT) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.mark_invitation_email_status(UUID, TEXT) FROM anon;
    REVOKE EXECUTE ON FUNCTION public.mark_invitation_email_status(UUID, TEXT) FROM authenticated;
    GRANT EXECUTE ON FUNCTION public.mark_invitation_email_status(UUID, TEXT) TO service_role;

    -- 4.15 Clerk JWT Claims Inspector (DEV ONLY)
    CREATE OR REPLACE FUNCTION public.inspect_clerk_jwt_claims()
    RETURNS TABLE (
        claim_sub       TEXT,
        claim_email     TEXT,
        claim_role      TEXT,
        claim_iss       TEXT,
        claim_exp       TEXT
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
    BEGIN
        RETURN QUERY SELECT
            auth.jwt() ->> 'sub',
            auth.jwt() ->> 'email',
            auth.jwt() ->> 'role',
            auth.jwt() ->> 'iss',
            auth.jwt() ->> 'exp';
    END;
    $$;

    ALTER FUNCTION public.inspect_clerk_jwt_claims() OWNER TO postgres;
    REVOKE EXECUTE ON FUNCTION public.inspect_clerk_jwt_claims() FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.inspect_clerk_jwt_claims() FROM anon;
    GRANT EXECUTE ON FUNCTION public.inspect_clerk_jwt_claims() TO authenticated;

    -- ===================================================================
    -- 5. ENABLE ROW LEVEL SECURITY
    -- ===================================================================

    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

    -- ===================================================================
    -- 6. ROW LEVEL SECURITY POLICIES
    -- ===================================================================

    -- 6.1 Profiles
    CREATE POLICY "profiles_select_self"
    ON public.profiles FOR SELECT TO authenticated
    USING (
        clerk_user_id = (auth.jwt() ->> 'sub')
    );

    CREATE POLICY "profiles_select_same_company"
    ON public.profiles FOR SELECT TO authenticated
    USING (
        company_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM public.get_my_auth_context() ctx
            WHERE ctx.ctx_company_id = profiles.company_id
            AND ctx.ctx_is_active = true
        )
        AND public._is_entitled()
    );

    CREATE POLICY "profiles_update_self"
    ON public.profiles FOR UPDATE TO authenticated
    USING (clerk_user_id = (auth.jwt() ->> 'sub'))
    WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

    -- 6.2 Companies
    CREATE POLICY "companies_select_owner"
    ON public.companies FOR SELECT TO authenticated
    USING (
        owner_clerk_id = (auth.jwt() ->> 'sub')
    );

    CREATE POLICY "companies_select_member"
    ON public.companies FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.get_my_auth_context() ctx
            WHERE ctx.ctx_company_id = companies.id
            AND ctx.ctx_is_active = true
        )
        AND public._is_entitled()
    );

    -- 6.3 Departments
    CREATE POLICY "departments_select"
    ON public.departments FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.get_my_auth_context() ctx
            WHERE ctx.ctx_company_id = departments.company_id
            AND ctx.ctx_is_active = true
        )
        AND public._is_entitled()
    );

    CREATE POLICY "departments_insert_admin"
    ON public.departments FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.get_my_auth_context() ctx
            WHERE ctx.ctx_company_id = departments.company_id
            AND ctx.ctx_role = 'company_admin'
            AND ctx.ctx_is_active = true
        )
        AND public._is_entitled()
    );

    CREATE POLICY "departments_update_admin"
    ON public.departments FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.get_my_auth_context() ctx
            WHERE ctx.ctx_company_id = departments.company_id
            AND ctx.ctx_role = 'company_admin'
            AND ctx.ctx_is_active = true
        )
        AND public._is_entitled()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.get_my_auth_context() ctx
            WHERE ctx.ctx_company_id = departments.company_id
            AND ctx.ctx_role = 'company_admin'
            AND ctx.ctx_is_active = true
        )
    );

    -- 6.4 Employees
    CREATE POLICY "employees_select_self"
    ON public.employees FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.get_my_auth_context() ctx
            WHERE ctx.ctx_employee_id = employees.id
            AND ctx.ctx_is_active = true
        )
        AND public._is_entitled()
    );

    CREATE POLICY "employees_select_admin"
    ON public.employees FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM public.get_my_auth_context() ctx
            WHERE ctx.ctx_company_id = employees.company_id
            AND ctx.ctx_role = 'company_admin'
            AND ctx.ctx_is_active = true
        )
        AND public._is_entitled()
    );

    CREATE POLICY "employees_select_manager"
    ON public.employees FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND EXISTS (
            SELECT 1 FROM public.get_my_auth_context() ctx
            WHERE ctx.ctx_company_id = employees.company_id
            AND ctx.ctx_role = 'manager'
            AND ctx.ctx_department_id IS NOT NULL
            AND ctx.ctx_department_id = employees.department_id
            AND ctx.ctx_is_active = true
        )
        AND public._is_entitled()
    );

    -- 6.5 Invitations
    -- No direct client table policies. All reads via get_company_invitations() RPC.
    -- All mutations via create_employee_and_invite(), resend_invitation(),
    -- validate_invitation(), accept_invitation(), reject_invitation() RPCs.

    -- 6.6 Attendance
    CREATE POLICY "attendance_select_self"
    ON public.attendance FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.get_my_auth_context() ctx
            WHERE ctx.ctx_employee_id = attendance.employee_id
            AND ctx.ctx_company_id = attendance.company_id
            AND ctx.ctx_is_active = true
        )
        AND public._is_entitled()
    );

    CREATE POLICY "attendance_select_admin"
    ON public.attendance FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.get_my_auth_context() ctx
            WHERE ctx.ctx_company_id = attendance.company_id
            AND ctx.ctx_role = 'company_admin'
            AND ctx.ctx_is_active = true
        )
        AND public._is_entitled()
    );

    CREATE POLICY "attendance_select_manager"
    ON public.attendance FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.get_my_auth_context() ctx
            WHERE ctx.ctx_company_id = attendance.company_id
            AND ctx.ctx_role = 'manager'
            AND ctx.ctx_department_id IS NOT NULL
            AND ctx.ctx_is_active = true
            AND attendance.employee_id IN (
                SELECT e.id FROM public.employees e
                WHERE e.department_id = ctx.ctx_department_id
                    AND e.deleted_at IS NULL
            )
        )
        AND public._is_entitled()
    );

    -- 6.7 Leaves
    CREATE POLICY "leaves_select_self"
    ON public.leaves FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.get_my_auth_context() ctx
            WHERE ctx.ctx_employee_id = leaves.employee_id
            AND ctx.ctx_company_id = leaves.company_id
            AND ctx.ctx_is_active = true
        )
        AND public._is_entitled()
    );

    CREATE POLICY "leaves_select_admin"
    ON public.leaves FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.get_my_auth_context() ctx
            WHERE ctx.ctx_company_id = leaves.company_id
            AND ctx.ctx_role = 'company_admin'
            AND ctx.ctx_is_active = true
        )
        AND public._is_entitled()
    );

    CREATE POLICY "leaves_select_manager"
    ON public.leaves FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.get_my_auth_context() ctx
            WHERE ctx.ctx_company_id = leaves.company_id
            AND ctx.ctx_role = 'manager'
            AND ctx.ctx_department_id IS NOT NULL
            AND ctx.ctx_is_active = true
            AND leaves.employee_id IN (
                SELECT e.id FROM public.employees e
                WHERE e.department_id = ctx.ctx_department_id
                    AND e.deleted_at IS NULL
            )
        )
        AND public._is_entitled()
    );
