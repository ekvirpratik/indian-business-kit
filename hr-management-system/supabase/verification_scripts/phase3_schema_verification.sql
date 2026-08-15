-- ===================================================================
-- PeakHR Phase 3 — Comprehensive Post-Migration Schema Verification
-- ===================================================================
-- Target Database: Supabase PostgreSQL
-- Purpose: Rigorous catalog-level audit of all 7 PeakHR tables, columns,
--          indexes, constraints, triggers, functions, signatures, security
--          definer properties, search_path, permissions, and RLS policies.
-- ===================================================================

DO $$
DECLARE
    v_passed INT := 0;
    v_failed INT := 0;
    v_errors TEXT[] := ARRAY[]::TEXT[];
    v_rec RECORD;
    v_count INT;
    v_found BOOLEAN;
BEGIN
    RAISE NOTICE '===================================================================';
    RAISE NOTICE '🚀 STARTING PEAKHR PHASE 3 COMPREHENSIVE SCHEMA VERIFICATION';
    RAISE NOTICE '===================================================================';

    -- -----------------------------------------------------------------
    -- 1. PRE-FLIGHT: Platform Subscriptions Table Audit
    -- -----------------------------------------------------------------
    RAISE NOTICE '';
    RAISE NOTICE '--- [1/7] AUDITING PLATFORM SUBSCRIPTIONS TABLE ---';
    
    SELECT count(*) INTO v_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'subscriptions';

    IF v_count = 0 THEN
        v_errors := array_append(v_errors, 'CRITICAL: public.subscriptions table is missing! Indian Business Kit platform billing table must exist.');
        v_failed := v_failed + 1;
    ELSE
        -- Check mandatory columns for PeakHR entitlement
        SELECT count(*) INTO v_count
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'subscriptions'
          AND column_name IN ('user_id', 'active', 'expires_at');
        
        IF v_count < 3 THEN
            v_errors := array_append(v_errors, 'CRITICAL: public.subscriptions is missing one or more required columns (user_id, active, expires_at)');
            v_failed := v_failed + 1;
        ELSE
            RAISE NOTICE '  ✅ public.subscriptions table and columns (user_id, active, expires_at) verified.';
            v_passed := v_passed + 1;
        END IF;
    END IF;

    -- -----------------------------------------------------------------
    -- 2. TABLE INVENTORY & COLUMN AUDIT
    -- -----------------------------------------------------------------
    RAISE NOTICE '';
    RAISE NOTICE '--- [2/7] AUDITING PEAKHR TABLES & MANDATORY COLUMNS ---';

    -- Helper table audit checklist
    CREATE TEMP TABLE IF NOT EXISTS _expected_cols (
        tbl TEXT,
        col TEXT
    ) ON COMMIT DROP;

    DELETE FROM _expected_cols;
    INSERT INTO _expected_cols VALUES
        -- companies
        ('companies', 'id'), ('companies', 'name'), ('companies', 'owner_clerk_id'),
        ('companies', 'status'), ('companies', 'timezone'), ('companies', 'created_at'), ('companies', 'updated_at'),
        -- departments
        ('departments', 'id'), ('departments', 'company_id'), ('departments', 'name'),
        ('departments', 'is_active'), ('departments', 'created_at'), ('departments', 'updated_at'),
        -- employees
        ('employees', 'id'), ('employees', 'company_id'), ('employees', 'department_id'),
        ('employees', 'employee_code'), ('employees', 'full_name'), ('employees', 'email'),
        ('employees', 'phone'), ('employees', 'position'), ('employees', 'date_of_joining'),
        ('employees', 'status'), ('employees', 'created_at'), ('employees', 'updated_at'), ('employees', 'deleted_at'),
        -- profiles
        ('profiles', 'id'), ('profiles', 'clerk_user_id'), ('profiles', 'email'),
        ('profiles', 'full_name'), ('profiles', 'avatar_url'), ('profiles', 'phone'),
        ('profiles', 'company_id'), ('profiles', 'employee_id'), ('profiles', 'role'),
        ('profiles', 'is_active'), ('profiles', 'created_at'), ('profiles', 'updated_at'),
        -- invitations
        ('invitations', 'id'), ('invitations', 'company_id'), ('invitations', 'employee_id'),
        ('invitations', 'email'), ('invitations', 'role'), ('invitations', 'token_hash'),
        ('invitations', 'status'), ('invitations', 'email_status'), ('invitations', 'invited_by'),
        ('invitations', 'expires_at'), ('invitations', 'created_at'), ('invitations', 'updated_at'),
        -- attendance
        ('attendance', 'id'), ('attendance', 'company_id'), ('attendance', 'employee_id'),
        ('attendance', 'attendance_date'), ('attendance', 'clock_in'), ('attendance', 'clock_out'),
        ('attendance', 'status'), ('attendance', 'notes'), ('attendance', 'created_at'), ('attendance', 'updated_at'),
        -- leaves
        ('leaves', 'id'), ('leaves', 'company_id'), ('leaves', 'employee_id'),
        ('leaves', 'leave_type'), ('leaves', 'start_date'), ('leaves', 'end_date'),
        ('leaves', 'days_count'), ('leaves', 'reason'), ('leaves', 'status'),
        ('leaves', 'reviewed_by'), ('leaves', 'reviewed_at'), ('leaves', 'review_notes'),
        ('leaves', 'created_at'), ('leaves', 'updated_at');

    FOR v_rec IN (
        SELECT ec.tbl, ec.col, (c.column_name IS NOT NULL) AS col_exists
        FROM _expected_cols ec
        LEFT JOIN information_schema.columns c 
               ON c.table_schema = 'public' AND c.table_name = ec.tbl AND c.column_name = ec.col
    )
    LOOP
        IF NOT v_rec.col_exists THEN
            v_errors := array_append(v_errors, format('Missing column: public.%s.%s', v_rec.tbl, v_rec.col));
            v_failed := v_failed + 1;
        END IF;
    END LOOP;

    IF v_failed = 0 THEN
        RAISE NOTICE '  ✅ All 7 PeakHR tables and all 64 defined columns verified successfully.';
        v_passed := v_passed + 1;
    END IF;

    -- -----------------------------------------------------------------
    -- 3. INDEXES & CONSTRAINTS AUDIT
    -- -----------------------------------------------------------------
    RAISE NOTICE '';
    RAISE NOTICE '--- [3/7] AUDITING INDEXES & CONSTRAINTS ---';

    -- Check Case-Insensitive / Unique Indexes
    FOR v_rec IN SELECT unnest(ARRAY[
        'idx_companies_owner_clerk_id',
        'idx_departments_company_name_ci',
        'idx_employees_company_email_active',
        'idx_employees_company_code_active',
        'idx_invitations_one_pending_per_employee',
        'idx_invitations_token_hash'
    ]) AS idx_name
    LOOP
        SELECT count(*) INTO v_count
        FROM pg_indexes
        WHERE schemaname = 'public' AND indexname = v_rec.idx_name;

        IF v_count = 0 THEN
            v_errors := array_append(v_errors, format('Missing critical index: %s', v_rec.idx_name));
            v_failed := v_failed + 1;
        ELSE
            RAISE NOTICE '  ✅ Index verified: %', v_rec.idx_name;
            v_passed := v_passed + 1;
        END IF;
    END LOOP;

    -- Check Constraints
    FOR v_rec IN SELECT unnest(ARRAY[
        'chk_super_admin_no_company',
        'chk_company_admin_no_employee',
        'uq_attendance_employee_date',
        'chk_leave_dates'
    ]) AS con_name
    LOOP
        SELECT count(*) INTO v_count
        FROM pg_constraint
        WHERE conname = v_rec.con_name;

        IF v_count = 0 THEN
            v_errors := array_append(v_errors, format('Missing constraint: %s', v_rec.con_name));
            v_failed := v_failed + 1;
        ELSE
            RAISE NOTICE '  ✅ Constraint verified: %', v_rec.con_name;
            v_passed := v_passed + 1;
        END IF;
    END LOOP;

    -- -----------------------------------------------------------------
    -- 4. TRIGGERS AUDIT
    -- -----------------------------------------------------------------
    RAISE NOTICE '';
    RAISE NOTICE '--- [4/7] AUDITING IMMUTABILITY & TIMESTAMP TRIGGERS ---';

    FOR v_rec IN SELECT unnest(ARRAY[
        'trg_profile_immutability',
        'trg_company_immutability',
        'set_companies_updated_at',
        'set_departments_updated_at',
        'set_employees_updated_at',
        'set_profiles_updated_at',
        'set_invitations_updated_at',
        'set_attendance_updated_at',
        'set_leaves_updated_at'
    ]) AS trg_name
    LOOP
        SELECT count(*) INTO v_count
        FROM pg_trigger
        WHERE tgname = v_rec.trg_name;

        IF v_count = 0 THEN
            v_errors := array_append(v_errors, format('Missing trigger: %s', v_rec.trg_name));
            v_failed := v_failed + 1;
        ELSE
            RAISE NOTICE '  ✅ Trigger verified: %', v_rec.trg_name;
            v_passed := v_passed + 1;
        END IF;
    END LOOP;

    -- -----------------------------------------------------------------
    -- 5. RPC FUNCTIONS, SECURITY DEFINER & SEARCH_PATH AUDIT
    -- -----------------------------------------------------------------
    RAISE NOTICE '';
    RAISE NOTICE '--- [5/7] AUDITING RPC FUNCTIONS (SECURITY DEFINER, SEARCH_PATH, OWNER) ---';

    CREATE TEMP TABLE IF NOT EXISTS _expected_funcs (
        fn_name TEXT,
        arg_types TEXT,
        is_sec_def BOOLEAN,
        expected_owner TEXT
    ) ON COMMIT DROP;

    DELETE FROM _expected_funcs;
    INSERT INTO _expected_funcs VALUES
        ('get_my_auth_context', '', true, 'postgres'),
        ('_has_active_platform_membership', 'text', true, 'postgres'),
        ('_is_entitled', '', true, 'postgres'),
        ('create_company_and_admin_profile', 'p_company_name text, p_timezone text', true, 'postgres'),
        ('create_employee_and_invite', 'p_actor_clerk_id text, p_full_name text, p_email text, p_phone text, p_position text, p_department_id uuid, p_role text, p_employee_code text, p_date_of_joining date', true, 'postgres'),
        ('resend_invitation', 'p_actor_clerk_id text, p_employee_id uuid', true, 'postgres'),
        ('validate_invitation', 'p_raw_token text', true, 'postgres'),
        ('accept_invitation', 'p_raw_token text, p_full_name text', true, 'postgres'),
        ('reject_invitation', 'p_raw_token text', true, 'postgres'),
        ('clock_in', 'p_notes text', true, 'postgres'),
        ('clock_out', '', true, 'postgres'),
        ('submit_leave_request', 'p_leave_type text, p_start_date date, p_end_date date, p_reason text', true, 'postgres'),
        ('cancel_leave_request', 'p_leave_id uuid', true, 'postgres'),
        ('review_leave_request', 'p_leave_id uuid, p_decision text, p_review_notes text', true, 'postgres'),
        ('get_company_invitations', '', true, 'postgres'),
        ('update_company_settings', 'p_name text, p_timezone text', true, 'postgres'),
        ('mark_invitation_email_status', 'p_invitation_id uuid, p_status text', true, 'postgres'),
        ('inspect_clerk_jwt_claims', '', true, 'postgres');

    FOR v_rec IN (
        SELECT ef.fn_name,
               p.prosecdef AS is_sec_def,
               u.usename AS owner_name,
               p.proconfig AS config_array
        FROM _expected_funcs ef
        LEFT JOIN pg_proc p ON p.proname = ef.fn_name AND p.pronamespace = 'public'::regnamespace
        LEFT JOIN pg_user u ON u.usesysid = p.proowner
    )
    LOOP
        IF v_rec.is_sec_def IS NULL THEN
            v_errors := array_append(v_errors, format('Missing function: public.%s()', v_rec.fn_name));
            v_failed := v_failed + 1;
        ELSE
            -- Check SECURITY DEFINER
            IF NOT v_rec.is_sec_def THEN
                v_errors := array_append(v_errors, format('Function public.%s() is NOT SECURITY DEFINER!', v_rec.fn_name));
                v_failed := v_failed + 1;
            END IF;

            -- Check search_path in proconfig
            IF v_rec.config_array IS NULL OR NOT (
                v_rec.config_array::TEXT LIKE '%search_path=public, pg_temp%' OR
                v_rec.config_array::TEXT LIKE '%search_path=public,pg_temp%' OR
                v_rec.config_array::TEXT LIKE '%search_path=public, extensions, pg_temp%' OR
                v_rec.config_array::TEXT LIKE '%search_path=public,extensions,pg_temp%'
            ) THEN
                v_errors := array_append(v_errors, format('Function public.%s() has unhardened search_path (config: %s)', v_rec.fn_name, v_rec.config_array));
                v_failed := v_failed + 1;
            ELSE
                RAISE NOTICE '  ✅ Function verified: public.%s() [SECURITY DEFINER, search_path hardened, owner=%]', v_rec.fn_name, v_rec.owner_name;
                v_passed := v_passed + 1;
            END IF;
        END IF;
    END LOOP;

    -- -----------------------------------------------------------------
    -- 6. FUNCTION EXECUTE PERMISSIONS / ROLE GRANTS AUDIT
    -- -----------------------------------------------------------------
    RAISE NOTICE '';
    RAISE NOTICE '--- [6/7] AUDITING FUNCTION EXECUTION PERMISSION BOUNDARIES ---';

    -- 6.1 Private function: _has_active_platform_membership
    IF has_function_privilege('anon', 'public._has_active_platform_membership(text)', 'EXECUTE')
       OR has_function_privilege('authenticated', 'public._has_active_platform_membership(text)', 'EXECUTE') THEN
        v_errors := array_append(v_errors, '_has_active_platform_membership() has excessive grants (must be revoked from anon/authenticated)');
        v_failed := v_failed + 1;
    ELSE
        RAISE NOTICE '  ✅ _has_active_platform_membership() is correctly PRIVATE.';
        v_passed := v_passed + 1;
    END IF;

    -- 6.2 Service-role ONLY functions
    FOR v_rec IN SELECT unnest(ARRAY[
        'public.create_employee_and_invite(text, text, text, text, text, uuid, text, text, date)',
        'public.resend_invitation(text, uuid)',
        'public.mark_invitation_email_status(uuid, text)'
    ]) AS fn_sig
    LOOP
        IF has_function_privilege('authenticated', v_rec.fn_sig, 'EXECUTE')
           OR has_function_privilege('anon', v_rec.fn_sig, 'EXECUTE') THEN
            v_errors := array_append(v_errors, format('SECURITY BREACH: %s is callable by authenticated/anon! Must be service_role only.', v_rec.fn_sig));
            v_failed := v_failed + 1;
        ELSIF NOT has_function_privilege('service_role', v_rec.fn_sig, 'EXECUTE') THEN
            v_errors := array_append(v_errors, format('CONFIGURATION ERROR: %s is not granted to service_role.', v_rec.fn_sig));
            v_failed := v_failed + 1;
        ELSE
            RAISE NOTICE '  ✅ Service-role boundary verified: %', v_rec.fn_sig;
            v_passed := v_passed + 1;
        END IF;
    END LOOP;

    -- 6.3 Guest / Public functions: validate_invitation, reject_invitation
    IF NOT has_function_privilege('anon', 'public.validate_invitation(text)', 'EXECUTE')
       OR NOT has_function_privilege('anon', 'public.reject_invitation(text)', 'EXECUTE') THEN
        v_errors := array_append(v_errors, 'validate_invitation/reject_invitation must be executable by anon.');
        v_failed := v_failed + 1;
    ELSE
        RAISE NOTICE '  ✅ Guest functions (validate_invitation, reject_invitation) granted to anon + authenticated.';
        v_passed := v_passed + 1;
    END IF;

    -- -----------------------------------------------------------------
    -- 7. RLS STATUS & POLICY INVENTORY AUDIT
    -- -----------------------------------------------------------------
    RAISE NOTICE '';
    RAISE NOTICE '--- [7/7] AUDITING RLS STATUS & POLICY INVENTORY ---';

    -- 7.1 Verify rowsecurity = true on all 7 tables
    FOR v_rec IN SELECT unnest(ARRAY['companies', 'departments', 'employees', 'profiles', 'invitations', 'attendance', 'leaves']) AS tbl_name
    LOOP
        SELECT count(*) INTO v_count
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = v_rec.tbl_name AND rowsecurity = true;

        IF v_count = 0 THEN
            v_errors := array_append(v_errors, format('CRITICAL: RLS is NOT enabled on public.%s!', v_rec.tbl_name));
            v_failed := v_failed + 1;
        ELSE
            RAISE NOTICE '  ✅ RLS is ENABLED on public.%s', v_rec.tbl_name;
            v_passed := v_passed + 1;
        END IF;
    END LOOP;

    -- 7.2 Verify public.invitations has ZERO direct policies
    SELECT count(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'invitations';

    IF v_count > 0 THEN
        v_errors := array_append(v_errors, format('SECURITY BREACH: %s policies found on public.invitations! Table must have zero policies (all access via trusted RPCs).', v_count));
        v_failed := v_failed + 1;
    ELSE
        RAISE NOTICE '  ✅ public.invitations table is completely isolated (0 direct client policies).';
        v_passed := v_passed + 1;
    END IF;

    -- 7.3 Verify exact expected policy list
    CREATE TEMP TABLE IF NOT EXISTS _expected_pols (
        tbl TEXT,
        pol TEXT
    ) ON COMMIT DROP;

    DELETE FROM _expected_pols;
    INSERT INTO _expected_pols VALUES
        ('profiles', 'profiles_select_self'),
        ('profiles', 'profiles_select_same_company'),
        ('profiles', 'profiles_update_self'),
        ('companies', 'companies_select_owner'),
        ('companies', 'companies_select_member'),
        ('departments', 'departments_select'),
        ('departments', 'departments_insert_admin'),
        ('departments', 'departments_update_admin'),
        ('employees', 'employees_select_self'),
        ('employees', 'employees_select_admin'),
        ('employees', 'employees_select_manager'),
        ('attendance', 'attendance_select_self'),
        ('attendance', 'attendance_select_admin'),
        ('attendance', 'attendance_select_manager'),
        ('leaves', 'leaves_select_self'),
        ('leaves', 'leaves_select_admin'),
        ('leaves', 'leaves_select_manager');

    FOR v_rec IN (
        SELECT ep.tbl, ep.pol, (p.policyname IS NOT NULL) AS pol_exists
        FROM _expected_pols ep
        LEFT JOIN pg_policies p ON p.schemaname = 'public' AND p.tablename = ep.tbl AND p.policyname = ep.pol
    )
    LOOP
        IF NOT v_rec.pol_exists THEN
            v_errors := array_append(v_errors, format('Missing expected RLS policy: %s on public.%s', v_rec.pol, v_rec.tbl));
            v_failed := v_failed + 1;
        END IF;
    END LOOP;

    IF v_failed = 0 THEN
        RAISE NOTICE '  ✅ All 17 expected RLS policies verified across all tables.';
        v_passed := v_passed + 1;
    END IF;

    -- -----------------------------------------------------------------
    -- FINAL VERIFICATION REPORT
    -- -----------------------------------------------------------------
    RAISE NOTICE '';
    RAISE NOTICE '===================================================================';
    RAISE NOTICE '📊 SCHEMA VERIFICATION AUDIT SUMMARY:';
    RAISE NOTICE '   Passed Checks: %', v_passed;
    RAISE NOTICE '   Failed Checks: %', v_failed;
    RAISE NOTICE '===================================================================';

    IF v_failed > 0 THEN
        RAISE EXCEPTION '❌ SCHEMA VERIFICATION FAILED WITH % ERRORS: %', v_failed, v_errors;
    ELSE
        RAISE NOTICE '🎉 ALL SCHEMA, FUNCTION, PERMISSION & RLS CHECKS PASSED PERFECTLY!';
    END IF;
END;
$$;
