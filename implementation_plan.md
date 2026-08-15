# Dynamic Program & Test Management System

This plan outlines the steps for executing Ticket 1 (Database Architecture Migration) and Ticket 2 (Create Shared Types & Constants), as well as a strategy for the resulting code refactoring.

## ⚠️ User Review Required

> [!WARNING]  
> **Breaking Change Alert**
> Removing the `exam_type` column from the `questions` table and relying on the new `test_id` foreign key will temporarily break the existing codebase. Pages like the Exam Engine, Admin Question Bank, and Dashboard currently rely on `exam_type`. We will need to update the frontend and API routes immediately after applying the DB changes. Please confirm if we should apply the DB schema and create the shared types first as a discrete step, or if we should also include the code refactoring in this execution phase to keep the app working.

## Open Questions

> [!IMPORTANT]  
> 1. Do you want me to provide the raw SQL for you to run manually in the Supabase Dashboard SQL Editor, or do you have a preference for how to execute this migration?
> 2. What should be done with existing exam sessions (`exam_sessions` table) that reference `exam_type = 'mock'` or `'final'`? Should we migrate those to reference a `test_id` as well?

## Proposed Changes

### Database Migration (Ticket 1)

We will provide a SQL migration script that performs the following steps safely:

1. **Create New Tables**:
   - `programs`: For dynamic certification programs (id, title, duration_minutes, total_questions, passing_percentage, is_bestseller, bestseller_text, button_text, show_on_program_page, is_active, etc.).
   - `tests`: For individual tests within a program (id, program_id, type [mock/final], title, is_locked, is_active).
   - `system_settings`: For configurable limits (setting_key, setting_value).

2. **Insert Default Configuration**:
   - `max_mock_tests = 20`

3. **Data Migration Strategy**:
   - Insert the default `VA-5 Examination` program into the `programs` table.
   - Insert `Mock Test 1` and `Final Certification Exam` into the `tests` table, linked to the `VA-5` program.
   - Add the `test_id` column to the `questions` table.
   - Update existing mock questions to reference `Mock Test 1`, and final questions to reference `Final Certification Exam`.
   - Once successfully migrated, safely drop the `exam_type` column from the `questions` table.

---

### Shared Types & Constants (Ticket 2)

#### [NEW] [program.ts](file:///e:/InterShip_projects/mf-sahi/src/types/program.ts)
- Will contain the `Program` interface mapping to the `programs` table.

#### [NEW] [test.ts](file:///e:/InterShip_projects/mf-sahi/src/types/test.ts)
- Will contain the `Test` interface mapping to the `tests` table, and an exported `TestType` enum/type (`'mock' | 'final'`).

#### [NEW] [settings.ts](file:///e:/InterShip_projects/mf-sahi/src/types/settings.ts)
- Will contain the `SystemSetting` interface and strongly-typed constants for setting keys (e.g., `MAX_MOCK_TESTS`).

#### [NEW] [question.ts](file:///e:/InterShip_projects/mf-sahi/src/types/question.ts)
- We will update the `Question` interface to reflect the removal of `exam_type` and the addition of `test_id: string`.

## Verification Plan

### Manual Verification
1. I will provide you with the SQL script to run in the Supabase Dashboard.
2. I will write the TypeScript definition files.
3. Once the database changes are applied, we will verify the schema matches our new types and immediately follow up with refactoring the codebase to resolve any TypeScript or API errors caused by the schema changes.
