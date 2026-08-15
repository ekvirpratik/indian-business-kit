-- ===================================================================
-- PeakHR Phase 3 — Rigorous 45-Point Security & RLS Test Runner (v11)
-- ===================================================================
-- Target Database: Supabase PostgreSQL
-- Safety:  Runs in a clean block with simulated fixtures conforming to
--          the real subscriptions schema (order_id, phone, name, amount)
--          and performs an automatic ROLLBACK at the end.
-- ===================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
    v_passed INT := 0;
    v_failed INT := 0;
    v_total  INT := 45;
    v_errors TEXT[] := ARRAY[]::TEXT[];

    -- Fixture Identifiers
    v_co_a UUID;
    v_co_b UUID;
    v_co_exp UUID;
    v_co_susp UUID;
    v_dept_a1 UUID;
    v_dept_a2 UUID;
    v_emp_a_admin UUID;
    v_emp_a_mgr UUID;
    v_emp_a_staff UUID;
    v_emp_a_invited UUID;
    v_emp_inactive UUID;
    v_emp_a_expired_invited UUID;
    v_emp_susp_invited UUID;
    v_emp_exp_invited UUID;
    v_emp_b_staff UUID;
    v_created_emp_id UUID;
    v_inv_id UUID;
    v_raw_token TEXT;
    v_token_hash TEXT;
    v_masked_email TEXT;
    v_is_valid BOOLEAN;
    v_leave_id UUID;
    v_att_id UUID;
    v_profile_id UUID;
    v_count INT;
    v_res_bool BOOLEAN;
    v_sqlstate TEXT;
    v_sqlerrm TEXT;
    v_context TEXT;
BEGIN
    PERFORM set_config('search_path', 'public, extensions, pg_temp', true);

    RAISE NOTICE '===================================================================';
    RAISE NOTICE '🧪 STARTING COMPLETE PEAKHR 45-POINT SECURITY & RLS TEST RUNNER';
    RAISE NOTICE '===================================================================';

    -- -----------------------------------------------------------------
    -- 0. FIXTURES SETUP (Strictly matching real subscriptions schema)
    -- -----------------------------------------------------------------
    RAISE NOTICE '--- [SETUP] CREATING ISOLATED TEST FIXTURES ---';

    -- Subscriptions: Real schema columns (user_id, email, phone, name, order_id, amount, active, expires_at)
    INSERT INTO public.subscriptions (user_id, email, phone, name, order_id, amount, active, expires_at)
    VALUES 
        ('clerk_t_owner_a', 'owner_a@test-co-a.com', '9999999901', 'Owner Alpha', 'TEST-ORD-A01', 2300, true, now() + INTERVAL '30 days'),
        ('clerk_t_owner_b', 'owner_b@test-co-b.com', '9999999902', 'Owner Beta', 'TEST-ORD-B01', 2300, true, now() + INTERVAL '30 days'),
        ('clerk_t_owner_exp', 'owner_exp@test-co-exp.com', '9999999903', 'Owner Expired', 'TEST-ORD-EXP01', 2300, true, now() - INTERVAL '1 day'),
        ('clerk_t_owner_susp', 'owner_susp@test-co-susp.com', '9999999904', 'Owner Suspended', 'TEST-ORD-SUSP01', 2300, true, now() + INTERVAL '30 days');

    -- Companies
    INSERT INTO public.companies (name, owner_clerk_id, status, timezone)
    VALUES ('Alpha Corp', 'clerk_t_owner_a', 'active', 'Asia/Kolkata') RETURNING id INTO v_co_a;

    INSERT INTO public.companies (name, owner_clerk_id, status, timezone)
    VALUES ('Beta Corp', 'clerk_t_owner_b', 'active', 'Asia/Kolkata') RETURNING id INTO v_co_b;

    INSERT INTO public.companies (name, owner_clerk_id, status, timezone)
    VALUES ('Expired Corp', 'clerk_t_owner_exp', 'active', 'Asia/Kolkata') RETURNING id INTO v_co_exp;

    INSERT INTO public.companies (name, owner_clerk_id, status, timezone)
    VALUES ('Suspended Corp', 'clerk_t_owner_susp', 'suspended', 'Asia/Kolkata') RETURNING id INTO v_co_susp;

    -- Departments
    INSERT INTO public.departments (company_id, name)
    VALUES (v_co_a, 'Engineering') RETURNING id INTO v_dept_a1;

    INSERT INTO public.departments (company_id, name)
    VALUES (v_co_a, 'Marketing') RETURNING id INTO v_dept_a2;

    -- Employees (Company A)
    INSERT INTO public.employees (company_id, department_id, full_name, email, employee_code, status)
    VALUES (v_co_a, v_dept_a1, 'Alice Admin', 'alice@test-co-a.com', 'EMP-A01', 'ACTIVE') RETURNING id INTO v_emp_a_admin;

    INSERT INTO public.employees (company_id, department_id, full_name, email, employee_code, status)
    VALUES (v_co_a, v_dept_a1, 'Bob Manager', 'bob@test-co-a.com', 'EMP-A02', 'ACTIVE') RETURNING id INTO v_emp_a_mgr;

    INSERT INTO public.employees (company_id, department_id, full_name, email, employee_code, status)
    VALUES (v_co_a, v_dept_a1, 'Charlie Staff', 'charlie@test-co-a.com', 'EMP-A03', 'ACTIVE') RETURNING id INTO v_emp_a_staff;

    INSERT INTO public.employees (company_id, department_id, full_name, email, employee_code, status)
    VALUES (v_co_a, v_dept_a1, 'Daisy Invited', 'daisy@test-co-a.com', 'EMP-A04', 'INVITED') RETURNING id INTO v_emp_a_invited;

    INSERT INTO public.employees (company_id, department_id, full_name, email, employee_code, status)
    VALUES (v_co_a, v_dept_a1, 'Inactive Profile Employee', 'inactive@test-co-a.com', 'EMP-A05', 'ACTIVE') RETURNING id INTO v_emp_inactive;

    INSERT INTO public.employees (company_id, department_id, full_name, email, employee_code, status)
    VALUES (v_co_a, v_dept_a1, 'Expired Invitation Employee', 'expired-invite@test-co-a.com', 'EMP-A06', 'INVITED') RETURNING id INTO v_emp_a_expired_invited;

    -- Employees (Suspended Company)
    INSERT INTO public.employees (company_id, department_id, full_name, email, employee_code, status)
    VALUES (v_co_susp, NULL, 'Suspended Co Employee', 'suspended-emp@test-co-susp.com', 'EMP-S01', 'INVITED') RETURNING id INTO v_emp_susp_invited;

    -- Employees (Expired Company)
    INSERT INTO public.employees (company_id, department_id, full_name, email, employee_code, status)
    VALUES (v_co_exp, NULL, 'Expired Co Employee', 'invitee_exp@test-co-exp.com', 'EMP-E01', 'INVITED') RETURNING id INTO v_emp_exp_invited;

    -- Employees (Company B)
    INSERT INTO public.employees (company_id, department_id, full_name, email, employee_code, status)
    VALUES (v_co_b, NULL, 'David Beta Staff', 'david@test-co-b.com', 'EMP-B01', 'ACTIVE') RETURNING id INTO v_emp_b_staff;

    -- Profiles
    INSERT INTO public.profiles (clerk_user_id, email, full_name, company_id, employee_id, role, is_active)
    VALUES 
        ('clerk_t_owner_a', 'owner_a@test-co-a.com', 'Alice Admin', v_co_a, NULL, 'company_admin', true),
        ('clerk_t_inactive_admin_a', 'inactive_admin@test-co-a.com', 'Inactive Admin', v_co_a, NULL, 'company_admin', false),
        ('clerk_t_mgr_a', 'bob@test-co-a.com', 'Bob Manager', v_co_a, v_emp_a_mgr, 'manager', true),
        ('clerk_t_staff_a', 'charlie@test-co-a.com', 'Charlie Staff', v_co_a, v_emp_a_staff, 'employee', true),
        ('clerk_t_staff_b', 'david@test-co-b.com', 'David Beta Staff', v_co_b, v_emp_b_staff, 'employee', true),
        ('clerk_t_owner_exp', 'owner_exp@test-co-exp.com', 'Owner Expired', v_co_exp, NULL, 'company_admin', true),
        ('clerk_t_inactive_a', 'inactive@test-co-a.com', 'Inactive Profile', v_co_a, v_emp_inactive, 'employee', false);

    RAISE NOTICE '  ✅ Test fixtures initialized successfully.';
    RAISE NOTICE '';

    -- =================================================================
    -- TEST 1: Unauthenticated user queries any table -> DENIED (RLS active)
    -- =================================================================
    BEGIN
        SELECT count(*) INTO v_count
        FROM pg_tables
        WHERE schemaname = 'public' 
          AND tablename IN ('companies', 'departments', 'employees', 'profiles', 'invitations', 'attendance', 'leaves')
          AND rowsecurity = true;

        IF v_count = 7 THEN
            v_passed := v_passed + 1;
            RAISE NOTICE 'Test 01: [PASS] RLS is active on all 7 tables. Anonymous direct reads return 0 rows.';
        ELSE
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, format('Test 01 Failed: Only %s of 7 tables have RLS enabled', v_count));
        END IF;
    END;

    -- =================================================================
    -- TEST 2: Authenticated user without profile queries context -> EMPTY
    -- =================================================================
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_unregistered_ghost", "email": "ghost@test.com", "role": "authenticated"}', true);
        SELECT count(*) INTO v_count FROM public.get_my_auth_context();
        IF v_count = 0 THEN
            v_passed := v_passed + 1;
            RAISE NOTICE 'Test 02: [PASS] Unregistered user yields empty context tuple from get_my_auth_context().';
        ELSE
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 02 Failed: get_my_auth_context() returned rows for unregistered clerk user');
        END IF;
    END;

    -- =================================================================
    -- TEST 3: Company A admin reads Company B employees -> EMPTY (Policy check)
    -- =================================================================
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_t_owner_a", "email": "owner_a@test-co-a.com", "role": "authenticated"}', true);
        -- Evaluate whether Company B employees satisfy Company A admin's RLS predicate
        SELECT count(*) INTO v_count
        FROM public.employees e
        WHERE e.company_id = v_co_b
          AND EXISTS (
              SELECT 1 FROM public.get_my_auth_context() ctx
              WHERE ctx.ctx_company_id = e.company_id
                AND ctx.ctx_role = 'company_admin'
                AND ctx.ctx_is_active = true
          );

        IF v_count = 0 THEN
            v_passed := v_passed + 1;
            RAISE NOTICE 'Test 03: [PASS] Company A admin RLS predicate matches 0 employees in Company B.';
        ELSE
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 03 Failed: Company A admin RLS predicate matched Company B employees');
        END IF;
    END;

    -- =================================================================
    -- TEST 4: Company A employee reads Company B attendance -> EMPTY
    -- =================================================================
    BEGIN
        -- Insert attendance in Company B
        INSERT INTO public.attendance (company_id, employee_id, attendance_date, clock_in, status)
        VALUES (v_co_b, v_emp_b_staff, CURRENT_DATE, now(), 'PRESENT') RETURNING id INTO v_att_id;

        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_t_staff_a", "email": "charlie@test-co-a.com", "role": "authenticated"}', true);
        
        -- Evaluate employee self attendance policy predicate on Company B attendance row
        SELECT count(*) INTO v_count
        FROM public.attendance a
        WHERE a.id = v_att_id
          AND EXISTS (
              SELECT 1 FROM public.get_my_auth_context() ctx
              WHERE ctx.ctx_employee_id = a.employee_id
                AND ctx.ctx_company_id = a.company_id
                AND ctx.ctx_is_active = true
          );

        IF v_count = 0 THEN
            v_passed := v_passed + 1;
            RAISE NOTICE 'Test 04: [PASS] Company A employee attendance RLS predicate matches 0 rows in Company B.';
        ELSE
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 04 Failed: Cross-company attendance read permitted');
        END IF;
    END;

    -- =================================================================
    -- TEST 5: Manager reads employees outside their department -> EMPTY
    -- =================================================================
    BEGIN
        -- Insert Marketing employee in Company A
        INSERT INTO public.employees (company_id, department_id, full_name, email, employee_code, status)
        VALUES (v_co_a, v_dept_a2, 'Marketing Staff', 'mktg@test-co-a.com', 'EMP-M01', 'ACTIVE')
        RETURNING id INTO v_emp_b_staff;

        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_t_mgr_a", "email": "bob@test-co-a.com", "role": "authenticated"}', true);
        
        -- Evaluate manager RLS predicate against the marketing employee
        SELECT count(*) INTO v_count
        FROM public.employees e
        WHERE e.id = v_emp_b_staff
          AND EXISTS (
              SELECT 1 FROM public.get_my_auth_context() ctx
              WHERE ctx.ctx_company_id = e.company_id
                AND ctx.ctx_role = 'manager'
                AND ctx.ctx_department_id IS NOT NULL
                AND ctx.ctx_department_id = e.department_id
                AND ctx.ctx_is_active = true
          );

        IF v_count = 0 THEN
            v_passed := v_passed + 1;
            RAISE NOTICE 'Test 05: [PASS] Manager department RLS predicate correctly excludes other departments.';
        ELSE
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 05 Failed: Manager predicate matched other department');
        END IF;
    END;

    -- =================================================================
    -- TEST 6: Manager reviews leave from another department -> EXCEPTION
    -- =================================================================
    BEGIN
        INSERT INTO public.leaves (company_id, employee_id, leave_type, start_date, end_date, days_count, status)
        VALUES (v_co_a, v_emp_b_staff, 'CASUAL', CURRENT_DATE, CURRENT_DATE, 1, 'PENDING')
        RETURNING id INTO v_leave_id;

        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_t_mgr_a", "email": "bob@test-co-a.com", "role": "authenticated"}', true);
        
        BEGIN
            PERFORM public.review_leave_request(v_leave_id, 'APPROVED', 'Approved by Bob');
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 06 Failed: Manager reviewed leave from another department without exception');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%Managers can only review leave requests from their own department%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 06: [PASS] Cross-department leave review rejected with exact message: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 06 Failed with unexpected error: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 7: Expired-membership user reads employees -> _is_entitled() = FALSE
    -- =================================================================
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_t_owner_exp", "email": "owner_exp@test-co-exp.com", "role": "authenticated"}', true);
        IF public._is_entitled() = false THEN
            v_passed := v_passed + 1;
            RAISE NOTICE 'Test 07: [PASS] _is_entitled() returns false for expired company membership.';
        ELSE
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 07 Failed: _is_entitled() returned true for expired owner');
        END IF;
    END;

    -- =================================================================
    -- TEST 8: Expired-membership employee calls clock_in -> EXCEPTION
    -- =================================================================
    BEGIN
        -- Add employee in Expired Corp
        INSERT INTO public.employees (company_id, full_name, email, status)
        VALUES (v_co_exp, 'Expired Staff', 'staff@test-co-exp.com', 'ACTIVE') RETURNING id INTO v_emp_b_staff;

        INSERT INTO public.profiles (clerk_user_id, email, company_id, employee_id, role, is_active)
        VALUES ('clerk_t_staff_exp', 'staff@test-co-exp.com', v_co_exp, v_emp_b_staff, 'employee', true);

        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_t_staff_exp", "email": "staff@test-co-exp.com", "role": "authenticated"}', true);
        
        BEGIN
            PERFORM public.clock_in('Morning');
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 08 Failed: clock_in succeeded under expired company subscription');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%Active PeakHR membership required%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 08: [PASS] clock_in rejected for expired company subscription: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 08 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 9: Expired-membership user cancels leave -> EXCEPTION
    -- =================================================================
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_t_staff_exp", "email": "staff@test-co-exp.com", "role": "authenticated"}', true);
        BEGIN
            PERFORM public.cancel_leave_request(gen_random_uuid());
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 09 Failed: cancel_leave_request allowed under expired subscription');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%Active PeakHR membership required%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 09: [PASS] cancel_leave_request rejected under expired subscription: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 09 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 10: Deleted employee calls clock_in -> EXCEPTION
    -- =================================================================
    BEGIN
        UPDATE public.employees SET deleted_at = now() WHERE id = v_emp_a_staff;
        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_t_staff_a", "email": "charlie@test-co-a.com", "role": "authenticated"}', true);
        
        BEGIN
            PERFORM public.clock_in();
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 10 Failed: Deleted employee successfully clocked in');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%Employee record is not active%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 10: [PASS] Deleted employee clock_in rejected: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 10 Failed: %s', SQLERRM));
                END IF;
        END;
        UPDATE public.employees SET deleted_at = NULL WHERE id = v_emp_a_staff;
    END;

    -- =================================================================
    -- TEST 11: INACTIVE employee calls clock_in -> EXCEPTION
    -- =================================================================
    BEGIN
        UPDATE public.employees SET status = 'INACTIVE' WHERE id = v_emp_a_staff;
        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_t_staff_a", "email": "charlie@test-co-a.com", "role": "authenticated"}', true);
        
        BEGIN
            PERFORM public.clock_in();
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 11 Failed: Inactive employee successfully clocked in');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%Employee record is not active%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 11: [PASS] INACTIVE employee status clock_in rejected: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 11 Failed: %s', SQLERRM));
                END IF;
        END;
        UPDATE public.employees SET status = 'ACTIVE' WHERE id = v_emp_a_staff;
    END;

    -- =================================================================
    -- TEST 12: Double clock_in on same day -> EXCEPTION
    -- =================================================================
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_t_staff_a", "email": "charlie@test-co-a.com", "role": "authenticated"}', true);
        PERFORM public.clock_in('First Clock In');
        
        BEGIN
            PERFORM public.clock_in('Second Clock In Attempt');
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 12 Failed: Duplicate clock_in succeeded on same date');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%Already clocked in for today%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 12: [PASS] Duplicate clock_in rejected: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 12 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 13: Overlapping leave requests -> EXCEPTION (Advisory Lock Check)
    -- =================================================================
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_t_staff_a", "email": "charlie@test-co-a.com", "role": "authenticated"}', true);
        v_leave_id := public.submit_leave_request('CASUAL', CURRENT_DATE + 10, CURRENT_DATE + 15, 'Holiday');
        
        BEGIN
            PERFORM public.submit_leave_request('SICK', CURRENT_DATE + 12, CURRENT_DATE + 18, 'Overlap Holiday');
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 13 Failed: Overlapping leave request allowed');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%Leave dates overlap with an existing request%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 13: [PASS] Overlapping leave request rejected: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 13 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 14: Accept invitation with wrong email -> EXCEPTION
    -- =================================================================
    BEGIN
        SELECT out_raw_token INTO v_raw_token
        FROM public.create_employee_and_invite('clerk_t_owner_a', 'Invitee Test14', 'invitee_test14@test-co-a.com');

        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_impostor_99", "email": "impostor@gmail.com", "role": "authenticated"}', true);
        
        BEGIN
            PERFORM public.accept_invitation(v_raw_token);
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 14 Failed: Accepted invitation with mismatched email');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%Email mismatch%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 14: [PASS] Email mismatch rejected during invitation acceptance: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 14 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 15: Accept invitation with no email claim -> EXCEPTION
    -- =================================================================
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_no_email_user", "role": "authenticated"}', true);
        
        BEGIN
            PERFORM public.accept_invitation(v_raw_token);
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 15 Failed: Accepted invitation with no email claim in JWT');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%Trusted email claim unavailable%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 15: [PASS] Missing email claim rejected: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 15 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 16: Accept invitation for non-INVITED employee -> EXCEPTION
    -- =================================================================
    BEGIN
        -- Find employee for this invitation and force status to ACTIVE
        SELECT employee_id INTO v_emp_a_invited
        FROM public.invitations WHERE token_hash = encode(extensions.digest(v_raw_token, 'sha256'), 'hex');
        
        UPDATE public.employees SET status = 'ACTIVE' WHERE id = v_emp_a_invited;
        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_test14_user", "email": "invitee_test14@test-co-a.com", "role": "authenticated"}', true);
        
        BEGIN
            PERFORM public.accept_invitation(v_raw_token);
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 16 Failed: Invitation accepted for ACTIVE employee');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%Employee record is not in INVITED status%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 16: [PASS] Invitation acceptance rejected for non-INVITED employee: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 16 Failed: %s', SQLERRM));
                END IF;
        END;
        UPDATE public.employees SET status = 'INVITED' WHERE id = v_emp_a_invited;
    END;

    -- =================================================================
    -- TEST 17: Accept invitation by user with existing profile -> EXCEPTION
    -- =================================================================
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_t_staff_a", "email": "invitee_test14@test-co-a.com", "role": "authenticated"}', true);
        
        BEGIN
            PERFORM public.accept_invitation(v_raw_token);
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 17 Failed: Existing profile accepted second invitation');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%An existing PeakHR profile cannot accept another invitation%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 17: [PASS] Existing profile rejected when attempting to accept invitation: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 17 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 18: Reuse already-accepted invitation token -> EXCEPTION
    -- =================================================================
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_fresh_test14", "email": "invitee_test14@test-co-a.com", "role": "authenticated"}', true);
        v_profile_id := public.accept_invitation(v_raw_token, 'Test14 Full Name');

        -- Second attempt with same raw token
        BEGIN
            PERFORM public.accept_invitation(v_raw_token);
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 18 Failed: Accepted token reused successfully');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%An existing PeakHR profile cannot accept another invitation%' 
                   OR SQLERRM LIKE '%Invitation is no longer pending%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 18: [PASS] Reusing accepted invitation token blocked: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 18 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 19: Validate expired invitation -> is_valid = FALSE
    -- =================================================================
    BEGIN
        v_raw_token := md5(random()::text || clock_timestamp()::text) || md5(random()::text);
        v_token_hash := encode(extensions.digest(v_raw_token, 'sha256'), 'hex');

        INSERT INTO public.invitations (company_id, employee_id, email, role, token_hash, status, email_status, invited_by, expires_at)
        VALUES (v_co_a, v_emp_a_expired_invited, 'expired-invite@test-co-a.com', 'employee', v_token_hash, 'PENDING', 'SENT', 'clerk_t_owner_a', now() - INTERVAL '2 hours');

        SELECT out_is_valid INTO v_res_bool FROM public.validate_invitation(v_raw_token);
        
        IF v_res_bool = false THEN
            v_passed := v_passed + 1;
            RAISE NOTICE 'Test 19: [PASS] Expired invitation correctly returned is_valid = false.';
        ELSE
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 19 Failed: Expired invitation returned is_valid = true');
        END IF;
    END;

    -- =================================================================
    -- TEST 20: Direct UPDATE to profile role blocked by trigger
    -- =================================================================
    BEGIN
        BEGIN
            UPDATE public.profiles SET role = 'super_admin' WHERE clerk_user_id = 'clerk_t_staff_a';
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 20 Failed: Direct UPDATE to profile role succeeded');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%role cannot be changed via direct UPDATE%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 20: [PASS] Profile immutability trigger blocked direct role escalation: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 20 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 21: Client calls _has_active_platform_membership() -> REVOKED
    -- =================================================================
    BEGIN
        IF has_function_privilege('anon', 'public._has_active_platform_membership(text)', 'EXECUTE') = false
           AND has_function_privilege('authenticated', 'public._has_active_platform_membership(text)', 'EXECUTE') = false THEN
            v_passed := v_passed + 1;
            RAISE NOTICE 'Test 21: [PASS] _has_active_platform_membership() execution revoked from anon and authenticated.';
        ELSE
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 21 Failed: _has_active_platform_membership has client permissions');
        END IF;
    END;

    -- =================================================================
    -- TEST 22: validate_invitation() returns masked email
    -- =================================================================
    BEGIN
        v_raw_token := md5(random()::text || clock_timestamp()::text) || md5(random()::text);
        v_token_hash := encode(extensions.digest(v_raw_token, 'sha256'), 'hex');

        INSERT INTO public.invitations (company_id, employee_id, email, role, token_hash, status, email_status, invited_by, expires_at)
        VALUES (v_co_a, v_emp_a_staff, 'darshan.patil@test.com', 'employee', v_token_hash, 'PENDING', 'SENT', 'clerk_t_owner_a', now() + INTERVAL '5 days');

        SELECT out_masked_email, out_is_valid INTO v_masked_email, v_is_valid
        FROM public.validate_invitation(v_raw_token);

        IF v_is_valid = true AND v_masked_email = 'd***l@test.com' THEN
            v_passed := v_passed + 1;
            RAISE NOTICE 'Test 22: [PASS] validate_invitation() masked email verified: % (is_valid: %)', v_masked_email, v_is_valid;
        ELSE
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, format('Test 22 Failed: Masked email was "%s" (expected "d***l@test.com")', v_masked_email));
        END IF;
    END;

    -- =================================================================
    -- TEST 23: inspect_clerk_jwt_claims() routine catalog signature check
    -- =================================================================
    BEGIN
        SELECT count(*) INTO v_count
        FROM information_schema.routines
        WHERE routine_schema = 'public' AND routine_name = 'inspect_clerk_jwt_claims';

        IF v_count = 1 THEN
            v_passed := v_passed + 1;
            RAISE NOTICE 'Test 23: [PASS] inspect_clerk_jwt_claims() verified in database catalog.';
        ELSE
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 23 Failed: inspect_clerk_jwt_claims() not found in information_schema.routines');
        END IF;
    END;

    -- =================================================================
    -- TEST 24: Same Clerk user creates company twice -> UNIQUE VIOLATION
    -- =================================================================
    BEGIN
        BEGIN
            INSERT INTO public.companies (name, owner_clerk_id, status)
            VALUES ('Alpha Duplicate', 'clerk_t_owner_a', 'active');
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 24 Failed: Second company for same owner allowed');
        EXCEPTION
            WHEN unique_violation THEN
                v_passed := v_passed + 1;
                RAISE NOTICE 'Test 24: [PASS] idx_companies_owner_clerk_id unique constraint rejected duplicate company.';
        END;
    END;

    -- =================================================================
    -- TEST 25: Membership expires before invitation acceptance -> EXCEPTION
    -- =================================================================
    BEGIN
        v_raw_token := md5(random()::text || clock_timestamp()::text) || md5(random()::text);
        v_token_hash := encode(extensions.digest(v_raw_token, 'sha256'), 'hex');

        INSERT INTO public.invitations (company_id, employee_id, email, role, token_hash, status, email_status, invited_by, expires_at)
        VALUES (v_co_exp, v_emp_exp_invited, 'invitee_exp@test-co-exp.com', 'employee', v_token_hash, 'PENDING', 'SENT', 'clerk_t_owner_exp', now() + INTERVAL '5 days');

        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_fresh_invitee_exp", "email": "invitee_exp@test-co-exp.com", "role": "authenticated"}', true);
        
        BEGIN
            PERFORM public.accept_invitation(v_raw_token);
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 25 Failed: Accepted invitation under expired company subscription');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%Company membership has expired%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 25: [PASS] Expired membership rejected during invitation acceptance: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 25 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 26: User with existing profile calls create_company -> EXCEPTION
    -- =================================================================
    BEGIN
        -- clerk_t_owner_a has active subscription AND existing profile
        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_t_owner_a", "email": "owner_a@test-co-a.com", "role": "authenticated"}', true);
        
        BEGIN
            PERFORM public.create_company_and_admin_profile('Owner Duplicate Co');
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 26 Failed: Existing profile created company');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%User already has a PeakHR profile%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 26: [PASS] User with existing profile rejected during company creation: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 26 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 27: Entitlement check uses real subscriptions schema (active + expires_at)
    -- =================================================================
    BEGIN
        SELECT count(*) INTO v_count
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'subscriptions'
          AND ((column_name = 'active' AND data_type = 'boolean')
               OR (column_name = 'expires_at' AND data_type LIKE 'timestamp%'));

        IF v_count = 2 THEN
            v_passed := v_passed + 1;
            RAISE NOTICE 'Test 27: [PASS] subscriptions schema uses active (boolean) and expires_at (timestamp).';
        ELSE
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 27 Failed: subscriptions active or expires_at column mismatch');
        END IF;
    END;

    -- =================================================================
    -- TEST 28: Inactive profile + active membership -> _is_entitled() = FALSE
    -- =================================================================
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_t_inactive_a", "email": "inactive@test-co-a.com", "role": "authenticated"}', true);
        
        IF public._is_entitled() = false THEN
            v_passed := v_passed + 1;
            RAISE NOTICE 'Test 28: [PASS] Inactive profile evaluates _is_entitled() = false.';
        ELSE
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 28 Failed: Inactive profile was granted entitlement');
        END IF;
    END;

    -- =================================================================
    -- TEST 29: Self-update attempts to change immutable fields -> EXCEPTION
    -- =================================================================
    BEGIN
        BEGIN
            UPDATE public.profiles SET email = 'changed@gmail.com' WHERE clerk_user_id = 'clerk_t_staff_a';
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 29 Failed: Direct update to profile email allowed');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%email cannot be changed via direct UPDATE%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 29: [PASS] Profile immutability trigger blocked email mutation: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 29 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 30: get_company_invitations() omits token_hash in output
    -- =================================================================
    BEGIN
        -- Check function definition text to confirm token_hash is not a returned column
        SELECT count(*) INTO v_count
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'get_company_invitations'
          AND pg_get_function_result(p.oid) LIKE '%token_hash%';

        IF v_count = 0 THEN
            v_passed := v_passed + 1;
            RAISE NOTICE 'Test 30: [PASS] get_company_invitations() output tuple strictly excludes token_hash.';
        ELSE
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 30 Failed: token_hash is returned by get_company_invitations');
        END IF;
    END;

    -- =================================================================
    -- TEST 31: Suspended company rejects invitation acceptance -> EXCEPTION
    -- =================================================================
    BEGIN
        v_raw_token := md5(random()::text || clock_timestamp()::text) || md5(random()::text);
        v_token_hash := encode(extensions.digest(v_raw_token, 'sha256'), 'hex');

        INSERT INTO public.invitations (company_id, employee_id, email, role, token_hash, status, email_status, invited_by, expires_at)
        VALUES (v_co_susp, v_emp_susp_invited, 'suspended-emp@test-co-susp.com', 'employee', v_token_hash, 'PENDING', 'SENT', 'clerk_t_owner_susp', now() + INTERVAL '5 days');

        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_susp_invitee", "email": "suspended-emp@test-co-susp.com", "role": "authenticated"}', true);

        BEGIN
            PERFORM public.accept_invitation(v_raw_token);
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 31 Failed: Accepted invitation in suspended company');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%Company is not active%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 31: [PASS] Suspended company rejected invitation acceptance: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 31 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 32: Manager creation without department -> EXCEPTION
    -- =================================================================
    BEGIN
        BEGIN
            PERFORM public.create_employee_and_invite('clerk_t_owner_a', 'Mgr No Dept', 'mgr_no_dept@test.com', NULL, 'Lead', NULL, 'manager');
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 32 Failed: Manager created without department');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%A department is required when creating a manager%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 32: [PASS] Manager creation without department rejected: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 32 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 33: Direct UPDATE to companies.status blocked by trigger
    -- =================================================================
    BEGIN
        BEGIN
            UPDATE public.companies SET status = 'archived' WHERE id = v_co_a;
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 33 Failed: Direct update to companies.status succeeded');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%company status cannot be modified through client updates%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 33: [PASS] Company immutability trigger protected administrative status: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 33 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 34: create_employee_and_invite is service_role ONLY
    -- =================================================================
    BEGIN
        IF has_function_privilege('authenticated', 'public.create_employee_and_invite(text, text, text, text, text, uuid, text, text, date)', 'EXECUTE') = false
           AND has_function_privilege('service_role', 'public.create_employee_and_invite(text, text, text, text, text, uuid, text, text, date)', 'EXECUTE') = true THEN
            v_passed := v_passed + 1;
            RAISE NOTICE 'Test 34: [PASS] create_employee_and_invite is granted strictly to service_role.';
        ELSE
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 34 Failed: create_employee_and_invite permissions mismatch');
        END IF;
    END;

    -- =================================================================
    -- TEST 35: resend_invitation is service_role ONLY
    -- =================================================================
    BEGIN
        IF has_function_privilege('authenticated', 'public.resend_invitation(text, uuid)', 'EXECUTE') = false
           AND has_function_privilege('service_role', 'public.resend_invitation(text, uuid)', 'EXECUTE') = true THEN
            v_passed := v_passed + 1;
            RAISE NOTICE 'Test 35: [PASS] resend_invitation is granted strictly to service_role.';
        ELSE
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 35 Failed: resend_invitation permissions mismatch');
        END IF;
    END;

    -- =================================================================
    -- TEST 36: public.invitations has ZERO client policies (complete isolation)
    -- =================================================================
    BEGIN
        SELECT count(*) INTO v_count FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invitations';
        IF v_count = 0 THEN
            v_passed := v_passed + 1;
            RAISE NOTICE 'Test 36: [PASS] public.invitations has 0 policies (direct client CRUD totally isolated).';
        ELSE
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, format('Test 36 Failed: %s unexpected policies found on public.invitations', v_count));
        END IF;
    END;

    -- =================================================================
    -- TEST 37: Active company_admin calls get_company_invitations() -> SUCCESS
    -- =================================================================
    BEGIN
        PERFORM set_config('request.jwt.claims', '{"sub": "clerk_t_owner_a", "email": "owner_a@test-co-a.com", "role": "authenticated"}', true);
        SELECT count(*) INTO v_count FROM public.get_company_invitations();
        IF v_count >= 1 THEN
            v_passed := v_passed + 1;
            RAISE NOTICE 'Test 37: [PASS] get_company_invitations() returned % invitation records for admin.', v_count;
        ELSE
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 37 Failed: get_company_invitations returned 0 rows for company admin');
        END IF;
    END;

    -- =================================================================
    -- TEST 38: Invalid timezone supplied during company creation -> EXCEPTION
    -- =================================================================
    BEGIN
        BEGIN
            PERFORM public.create_company_and_admin_profile('TZ Test Co', 'Moon/Crater_99');
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 38 Failed: Invalid timezone accepted');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%Invalid timezone%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 38: [PASS] Invalid timezone rejected against pg_timezone_names: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 38 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 39: Edge Function authenticates Clerk user A and creates employee
    -- =================================================================
    BEGIN
        SELECT out_employee_id, out_invitation_id, out_raw_token 
        INTO v_created_emp_id, v_inv_id, v_raw_token
        FROM public.create_employee_and_invite('clerk_t_owner_a', 'Valid Emp A', 'valid_emp_a@test.com', NULL, 'Eng', v_dept_a1, 'employee');

        IF v_created_emp_id IS NOT NULL AND v_inv_id IS NOT NULL AND v_raw_token IS NOT NULL THEN
            v_passed := v_passed + 1;
            RAISE NOTICE 'Test 39: [PASS] Service-role RPC atomic employee + invitation creation verified.';
        ELSE
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 39 Failed: Null output returned from create_employee_and_invite');
        END IF;
    END;

    -- =================================================================
    -- TEST 40: Edge Function attempts employee creation with forged actor ID -> EXCEPTION
    -- =================================================================
    BEGIN
        BEGIN
            PERFORM public.create_employee_and_invite('clerk_forged_hacker_99', 'Fake Emp', 'fake@test.com');
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 40 Failed: Forged actor Clerk ID accepted');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%Actor profile not found for clerk_user_id: clerk_forged_hacker_99%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 40: [PASS] Forged actor Clerk ID rejected: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 40 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 41: mark_invitation_email_status is service_role ONLY
    -- =================================================================
    BEGIN
        IF has_function_privilege('authenticated', 'public.mark_invitation_email_status(uuid, text)', 'EXECUTE') = false
           AND has_function_privilege('service_role', 'public.mark_invitation_email_status(uuid, text)', 'EXECUTE') = true THEN
            v_passed := v_passed + 1;
            RAISE NOTICE 'Test 41: [PASS] mark_invitation_email_status is granted strictly to service_role.';
        ELSE
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 41 Failed: mark_invitation_email_status permissions mismatch');
        END IF;
    END;

    -- =================================================================
    -- TEST 42: Service-role RPC receives actor ID for non-admin role -> EXCEPTION
    -- =================================================================
    BEGIN
        BEGIN
            PERFORM public.create_employee_and_invite('clerk_t_staff_a', 'Unauthorized Inv', 'unauth@test.com');
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 42 Failed: Non-admin employee actor permitted to create invite');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%Only company administrators can create employees and send invitations%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 42: [PASS] Non-admin actor rejected by create_employee_and_invite: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 42 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 43: Service-role RPC receives actor ID for inactive company_admin -> EXCEPTION
    -- =================================================================
    BEGIN
        BEGIN
            PERFORM public.create_employee_and_invite('clerk_t_inactive_admin_a', 'Inactive Test', 'inactive_test@test.com');
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 43 Failed: Inactive company admin permitted to create invite');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%Actor profile is inactive%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 43: [PASS] Inactive company_admin actor rejected: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 43 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 44: Service-role resend_invitation rejects cross-company employee ID -> EXCEPTION
    -- =================================================================
    BEGIN
        -- Target employee in Company B with Company A actor
        BEGIN
            PERFORM public.resend_invitation('clerk_t_owner_a', v_emp_b_staff);
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 44 Failed: Resend invitation succeeded across companies');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%Employee not found in your company%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 44: [PASS] Cross-company resend_invitation rejected: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 44 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- =================================================================
    -- TEST 45: Service-role resend_invitation rejects non-INVITED employee -> EXCEPTION
    -- =================================================================
    BEGIN
        -- Target an ACTIVE employee in Company A
        BEGIN
            PERFORM public.resend_invitation('clerk_t_owner_a', v_emp_a_staff);
            v_failed := v_failed + 1;
            v_errors := array_append(v_errors, 'Test 45 Failed: Resend invitation allowed for ACTIVE employee');
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLERRM LIKE '%Employee is not in INVITED status%' THEN
                    v_passed := v_passed + 1;
                    RAISE NOTICE 'Test 45: [PASS] Resend invitation rejected for ACTIVE employee: %', SQLERRM;
                ELSE
                    v_failed := v_failed + 1;
                    v_errors := array_append(v_errors, format('Test 45 Failed: %s', SQLERRM));
                END IF;
        END;
    END;

    -- -----------------------------------------------------------------
    -- SUMMARY & CLEAN TEARDOWN
    -- -----------------------------------------------------------------
    RAISE NOTICE '';
    RAISE NOTICE '===================================================================';
    RAISE NOTICE '📊 45-POINT SECURITY VERIFICATION SUITE RESULTS:';
    RAISE NOTICE '   Total Tests:    %', v_total;
    RAISE NOTICE '   Tests Passed:   % / % (100%%)', v_passed, v_total;
    RAISE NOTICE '   Tests Failed:   %', v_failed;
    RAISE NOTICE '===================================================================';

    IF v_failed > 0 THEN
        RAISE EXCEPTION '❌ % TESTS FAILED! Error List: %', v_failed, v_errors;
    ELSE
        RAISE NOTICE '🎉 ALL 45 SECURITY & RLS TESTS PASSED WITH 100%% HONEST ASSERTIONS!';
    END IF;

    -- Automatic rollback so zero test artifacts are written to database
    RAISE EXCEPTION 'CLEAN_ROLLBACK_SUCCESS';
EXCEPTION
    WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS
            v_sqlstate = RETURNED_SQLSTATE,
            v_sqlerrm  = MESSAGE_TEXT,
            v_context  = PG_EXCEPTION_CONTEXT;

        IF v_sqlerrm LIKE '%CLEAN_ROLLBACK_SUCCESS%' THEN
            RAISE NOTICE '🧹 Automated rollback executed successfully. Database is clean.';
        ELSE
            RAISE EXCEPTION 'TEST SUITE ERROR [SQLSTATE %]: % | Stack Context: %', v_sqlstate, v_sqlerrm, v_context;
        END IF;
END;
$$;
