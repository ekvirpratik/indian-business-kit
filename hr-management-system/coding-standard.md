# CODING_STANDARDS.md

# Indian Business Kit HRMS — Engineering & Coding Standards

---

# 1. Purpose

This document defines the mandatory coding rules for all developers and AI coding agents working on the Indian Business Kit HRMS.

The goal is not simply to make the application work.

The goal is to create a:

- Maintainable codebase
- Scalable SaaS architecture
- Secure application
- High-performance user experience
- Professional engineering standard

Every piece of code should be understandable by a developer who joins the project years later.

---

# 2. AI Agent Rules (Most Important)

AI agents must follow these principles.

---

## Never Make Architecture Decisions

Do not:

- Create random folders.
- Move files without approval.
- Introduce unnecessary libraries.
- Change database design.
- Change security rules.
- Create duplicate components.

The architecture defined in:

- PRODUCT.md
- ARCHITECTURE.md
- DATABASE.md
- SECURITY.md
- UI_GUIDELINES.md

is the single source of truth.

---

## Work Through Small Tasks

Never build:

"Complete HRMS"

Instead work on:

Example:

HR-001:
Employee Data Table

HR-002:
Create Employee Form

HR-003:
Employee Invitation Flow

HR-004:
Employee Profile Page

Each task must have:

- Functional requirements.
- Technical requirements.
- UI requirements.
- Testing checklist.

---

# 3. Technology Rules

Mandatory technologies:

Frontend:

- React 19
- TypeScript strict mode
- React Router v7

UI:

- Tailwind CSS
- shadcn/ui
- Framer Motion

Data:

- Supabase
- TanStack Query

Forms:

- React Hook Form
- Zod

---

# 4. Project Structure

The application uses feature-based architecture.

Correct:

```text
features/
    employees/
        components/
        pages/
        hooks/
        services/
        schemas/
        types.ts
```

Wrong:

```text
components/
    EmployeePage.tsx
    EmployeeTable.tsx
    EmployeeForm.tsx
```

Features must be isolated.

---

# 5. File Size Limits

Large files are difficult to maintain.

Maximum guidelines:

Components:

- 200 lines preferred.
- 300 lines absolute maximum.

Hooks:

- 150 lines preferred.

Service files:

- 200 lines preferred.

If a file becomes large:

Split it.

---

# 6. Component Architecture

Components are responsible only for:

- Rendering UI.
- Handling interactions.
- Managing local visual state.

Components must NOT:

- Call Supabase directly.
- Contain database queries.
- Handle business logic.
- Handle complex data transformations.

---

Correct architecture:

```text
Page
 |
 Components
 |
 Hooks
 |
 Services
 |
 Supabase
```

---

Example:

```text
EmployeePage.tsx

       |
       |
useEmployees()

       |
       |
employee.service.ts

       |
       |
supabase client
```

---

# 7. Data Fetching Standards

Never use:

- useEffect + useState for server data.

Always use:

TanStack Query.

Use:

- useQuery for reading.
- useMutation for creating.
- useMutation for updating.
- useMutation for deleting.

Required:

- Query caching.
- Query invalidation.
- Optimistic updates where appropriate.

---

# 8. TypeScript Standards

Strict mode is mandatory.

Forbidden:

```ts
any
```

Avoid:

```ts
as unknown as
```

unless there is a documented reason.

---

Every feature should have dedicated types.

Example:

```text
employees/
    types.ts
```

Example:

```ts
export interface Employee {
  id: string
  companyId: string
  firstName: string
  email: string
}
```

---

# 9. Form Standards

All forms must use:

- React Hook Form
- Zod validation

Never:

Write validation inside components.

Correct:

```text
employees/
    schemas/
        employee.schema.ts
```

---

Validation must exist:

Frontend:

- Better user experience.

Backend:

- Security.

Never trust frontend validation alone.

---

# 10. Service Layer Standards

All communication with Supabase must happen inside services.

Correct:

```text
employees/
    services/
        employee.service.ts
```

Forbidden:

```tsx
function EmployeePage() {
  supabase.from('employees').select('*')
}
```

---

# 11. Error Handling Standards

Never:

```ts
console.log(error)
```

as the final solution.

Every operation must have:

- Loading state.
- Success state.
- Error state.
- Retry mechanism where appropriate.

Errors shown to users must be understandable.

Bad:

```
Database error 500
```

Good:

```
Unable to load employees.
Please try again.
```

---

# 12. Loading Standards

Every data-driven page requires:

- Skeleton loading.
- Empty state.
- Error state.

Never display:

```
Loading...
```

for complete pages.

Examples:

Employees:

- EmployeeTableSkeleton

Dashboard:

- DashboardSkeleton

Profile:

- EmployeeProfileSkeleton

---

# 13. Naming Conventions

Components:

```text
EmployeeTable.tsx
EmployeeForm.tsx
LeaveRequestCard.tsx
```

Hooks:

```text
useEmployees.ts
useAttendance.ts
```

Services:

```text
employee.service.ts
leave.service.ts
```

Schemas:

```text
employee.schema.ts
```

Avoid names like:

```
helper.js
utils2.ts
newFile.tsx
```

---

# 14. Constants

Do not hardcode values.

Bad:

```ts
if (role === "admin")
```

Good:

```ts
ROLES.COMPANY_ADMIN
```

Create:

```text
constants/
    roles.ts
    routes.ts
    statuses.ts
```

---

# 15. Security Rules

Frontend permissions are only for user experience.

Never assume:

```ts
if (user.role === "admin")
```

means secure access.

Real security must exist in:

- Supabase RLS.
- Backend authorization.
- Database policies.

Never trust:

- company_id from the browser.
- Hidden fields.
- URL parameters.

---

# 16. Performance Standards

Required:

- Route-based lazy loading.
- Code splitting.
- Pagination.
- Debounced searching.
- Optimized images.

Never load thousands of records at once.

---

# 17. Accessibility Standards

Every UI component must support:

- Keyboard navigation.
- Focus states.
- Proper labels.
- Screen readers where necessary.
- Sufficient color contrast.

---

# 18. Testing Standards

Every feature must be tested.

---

## Functional Testing

Example:

Admin creates employee.

Expected:

- Employee appears in the table.
- Database record exists.
- Activity log is created.

---

## Permission Testing

Test:

Employee tries:

- Opening admin pages.
- Accessing another employee.
- Changing request payloads.

The system must reject these actions.

---

## Failure Testing

Test:

- No internet.
- Supabase failure.
- Invalid form input.
- Expired invitation link.

The application should fail gracefully.

---

# 19. Git Standards

Branch naming:

Correct:

```
feature/employee-management

feature/attendance-system

bugfix/invitation-expiry
```

---

Commit messages:

Correct:

```
feat: add employee invitation system

fix: prevent duplicate attendance records

refactor: move employee queries into service layer
```

---

# 20. Documentation Standards

Every major feature must include:

- Purpose.
- Architecture decisions.
- Database dependencies.
- Security considerations.

Required files:

README.md

ARCHITECTURE.md

DATABASE.md

SECURITY.md

---

# 21. AI Context Isolation Rule

AI agents must never reference files, components,
libraries, routes, features, or audit reports that do not
exist in the current codebase.

Before creating reports, audits, or summaries, inspect
the actual project files and generate documentation
only from the current repository state.

Do not reuse previous project context.

---

# 22. AI Agent Final Checklist

Before marking any task complete, the AI must answer:

1. Did I follow the project architecture?

2. Did I avoid large files?

3. Did I avoid using any?

4. Did I separate UI, hooks, and services?

5. Did I use TypeScript correctly?

6. Did I add loading states?

7. Did I add empty and error states?

8. Is the code responsive?

9. Is the feature secure?

10. Did I introduce duplicate code?

If any answer is "No", the task is not complete.

---

# Final Engineering Principle

Code is written once but maintained for years.

The objective is not to create the fastest solution.

The objective is to create code that is:

- Secure.
- Readable.
- Modular.
- Testable.
- Scalable.

Every AI agent must behave like a senior software engineer working on a production SaaS product.
