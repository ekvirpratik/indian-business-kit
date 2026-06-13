Bro, this is probably the **most important question** of the whole project. A lot of developers can make a project work, but a **production SaaS product** needs to be written so that after 2–3 years another developer can join, understand it in a week, and continue building.

For your **React 19 + Vite + React Router v7 + TypeScript + Tailwind + shadcn + Supabase + Clerk** stack, follow these practices.

---

# 1. Think Like a Company, Not a Solo Developer

Never write code like:

```
src/
  App.jsx
  Dashboard.jsx
  Employee.jsx
  Attendance.jsx
  utils.js
```

This becomes a nightmare.

Structure your app by **feature/domain**.

---

# Recommended Folder Architecture

```
src/
│
├── app/                      # Application setup
│   ├── router.tsx
│   ├── providers.tsx
│   └── store.ts
│
├── components/               # Shared reusable UI
│   ├── ui/                   # shadcn components
│   ├── layouts/
│   ├── charts/
│   └── common/
│
├── features/
│   │
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   │
│   ├── employees/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── schemas.ts
│   │   └── types.ts
│   │
│   ├── attendance/
│   ├── payroll/
│   ├── leaves/
│   └── departments/
│
├── lib/                      # Config & external clients
│   ├── supabase.ts
│   ├── clerk.ts
│   ├── api.ts
│   └── utils.ts
│
├── hooks/                    # Global custom hooks
│
├── types/                    # Shared TypeScript types
│
├── constants/
│
├── assets/
│
└── main.tsx
```

A new developer can instantly understand where everything is.

---

# 2. Use TypeScript Strictly

Never use:

```ts
any
```

Bad:

```ts
function employee(data: any) {}
```

Good:

```ts
interface Employee {
  id: string
  name: string
  email: string
  departmentId: string
}

function createEmployee(data: Employee) {}
```

Your database should have matching TypeScript types.

---

# 3. Separate UI From Business Logic

Bad:

```tsx
function EmployeePage() {
  const [employees, setEmployees] = useState([]);

  async function addEmployee() {
    const response = await supabase
      .from("employees")
      .insert(...);
  }
}
```

Your component now does everything.

---

Good:

```
EmployeePage
      |
      |
useEmployees()
      |
      |
employeeService
      |
      |
Supabase
```

Example:

```
features/employees/services/employee.service.ts
```

```ts
export async function createEmployee(data) {
  return supabase.from('employees').insert(data)
}
```

Your React component only handles UI.

---

# 4. Create Reusable Custom Hooks

Example:

```
useEmployees.ts
```

Responsible for:

- Fetching
- Loading states
- Error states
- Mutations

Your page:

```tsx
const { employees, loading, createEmployee } = useEmployees()
```

Very clean.

---

# 5. Use a Data Fetching Library

Don't manage server state manually.

Avoid:

```tsx
useEffect(() => {
  fetchEmployees()
}, [])
```

Use:

- TanStack Query

It gives you:

- Caching
- Refetching
- Loading states
- Optimistic updates
- Pagination support

Example:

```
useQuery()
useMutation()
```

---

# 6. Keep Components Small

Bad:

```
EmployeePage.tsx

1500 lines
```

This is a disaster.

---

Aim:

```
EmployeePage
   |
   |
   ├── EmployeeTable
   ├── EmployeeFilters
   ├── EmployeeDialog
   ├── EmployeeStats
   └── EmployeeActions
```

Rule:

> If a component is above ~200–300 lines, ask yourself if it should be split.

---

# 7. Create a Design System

Do not randomly write:

```tsx
<button className="bg-blue-500 px-3">
```

everywhere.

Create reusable components:

```
components/ui/
```

Use shadcn:

```tsx
<Button>
```

Create your variants:

```
primary
secondary
danger
ghost
```

One change updates the whole application.

---

# 8. Centralize Constants

Bad:

```ts
if(role === "admin")
```

in 20 places.

---

Good:

```ts
export const ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
}
```

Now changing a role is easy.

---

# 9. Form Validation

Never trust frontend inputs.

Use:

- React Hook Form
- Zod

Example:

```
employee.schema.ts
```

```ts
name: z.string().min(3)
```

Same schema can be reused.

---

# 10. Error Handling Strategy

Never:

```ts
console.log(error)
```

Create a pattern.

Example:

```
lib/errors.ts
```

Handle:

- API errors
- Authentication errors
- Validation errors

Show user-friendly messages:

```
Unable to save employee.
Please try again.
```

---

# 11. Authentication & Authorization

Never trust frontend roles.

Wrong:

```ts
if(user.role === "admin")
```

and assume security.

---

Correct:

Frontend:

- Hide buttons

Backend:

- Supabase RLS verifies permissions

Example:

```
Employee can only read:
company_id = their company
AND
id = their own employee ID
```

---

# 12. Environment Variables

Never:

```ts
const KEY = 'abcd123'
```

Use:

```
.env
```

Example:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_KEY=
VITE_CLERK_KEY=
```

---

# 13. Use Route-Based Code Splitting

Do not load your whole app.

Example:

```
/dashboard
/employees
/payroll
/settings
```

Each should be lazy loaded.

```tsx
const EmployeePage = lazy(() => import('./EmployeePage'))
```

Benefits:

- Faster loading
- Smaller bundles

---

# 14. Naming Conventions

Files:

```
EmployeeTable.tsx
EmployeeForm.tsx
useEmployees.ts
employee.service.ts
employee.types.ts
```

Avoid:

```
emp.js
helper.js
newFile.jsx
```

---

# 15. Write Self-Documenting Code

Bad:

```ts
const x = calculate(y)
```

Good:

```ts
const monthlyPayrollTotal = calculateMonthlyPayroll(employees)
```

A developer should understand code without comments.

---

# 16. Comments: Write Why, Not What

Bad:

```ts
// increase i by one
i++
```

Good:

```ts
// Prevent duplicate payroll generation
if (payrollExists) return
```

---

# 17. Logging

Development:

```
console.log()
```

is okay.

Production:

Use proper logging.

Examples:

- Sentry for errors
- Analytics events

Track:

- Failed payments
- Failed API requests
- Authentication issues

---

# 18. Git Workflow

Never:

```
final-final-new-working.jsx
```

Use branches:

```
main
develop
feature/employee-management
feature/payroll
bugfix/login-error
```

Commit messages:

Good:

```
feat: add employee invitation flow

fix: resolve attendance timezone issue

refactor: move payroll logic to service layer
```

---

# 19. Testing Strategy

At least:

## Unit Tests

For:

- Utility functions
- Calculations

Example:

```
calculateSalary()
```

---

## Component Tests

For:

- Forms
- Dialogs
- Permissions

---

## E2E Tests

Critical flows:

- Login
- Create employee
- Approve leave
- Generate payroll

Tools:

- Vitest
- React Testing Library
- Playwright

---

# 20. Documentation

Create:

```
README.md
```

Include:

- Setup instructions
- Environment variables
- Folder structure
- Development guidelines

Create:

```
ARCHITECTURE.md
```

Explain:

- Authentication flow
- Database relationships
- RLS strategy
- User roles

---

# 21. Performance Checklist

Before production:

- Use lazy routes
- Paginate tables
- Debounce search
- Optimize images
- Avoid unnecessary re-renders
- Use React.memo only where needed
- Use virtualization for huge tables

---

# 22. Security Checklist

- Enable Supabase RLS
- Validate all inputs with Zod
- Sanitize uploaded files
- Restrict storage buckets
- Use HTTPS
- Rate limit sensitive actions
- Protect API keys
- Implement audit logs

---

# My Personal Recommendation for Indian Business Kit

Because this is not just a college project but a real SaaS, I would treat the codebase like a startup from day one.

Follow this mindset:

```
Code should not only work today.
Code should be understandable 3 years later
by a developer who has never met you.
```

A good target for your project is to make it look like a codebase that a company would confidently put into production.

For this HR module, I would especially prioritize:

1. Feature-based architecture
2. TypeScript strict mode
3. TanStack Query
4. Zod + React Hook Form
5. Supabase RLS
6. Route code splitting
7. Clean component composition
8. Documentation

If you maintain these 8 things, your project will already be ahead of many production startups.

Bro, **this is the exact right mindset when working with AI agents**.

A lot of people fail with AI coding because they treat it like a magic button:

> "Build me an HRMS."

The agent then creates:

- random folder structures,
- huge 1000-line components,
- duplicated logic,
- security issues,
- no types,
- no reusable components,
- bad state management.

You should treat AI agents like **junior developers**. A junior developer can write 1000 lines in 5 minutes, but **you must give them architecture, rules, tickets, acceptance criteria, and code review standards.**

---

# MASTER RULE: The AI Agent Is Not Allowed To Make Architectural Decisions

Before writing any code, give every agent this system instruction:

---

# AI Development Rules For Indian Business Kit HRMS

You are a senior frontend engineer working on a production-grade multi-tenant SaaS application.

You are NOT allowed to make random architectural decisions.

Before writing code, follow the existing documentation:

- PRODUCT.md
- ARCHITECTURE.md
- DATABASE.md
- SECURITY.md
- CODING_STANDARDS.md
- UI_GUIDELINES.md

The application must be maintainable by other developers for years.

---

## 1. General Coding Rules

### Never write large files.

Limits:

Component files:

```
Max 200-250 lines
```

Hooks:

```
Max 150 lines
```

Service files:

```
Max 200 lines
```

If a file becomes larger, split it.

---

## 2. Use Feature-Based Architecture

Never create:

```
components/
    EmployeePage.tsx
    Attendance.tsx
    Leave.tsx
```

Correct:

```
features/
    employees/
        components/
        hooks/
        services/
        types.ts
        schemas.ts
        pages/

    attendance/
        components/
        hooks/
        services/
```

---

# 3. Component Responsibilities

Components are only responsible for:

- rendering UI
- handling user interaction

Components should NOT:

- directly call Supabase
- contain business logic
- manipulate database data

Wrong:

```tsx
function EmployeePage() {
  useEffect(() => {
    supabase.from('employees').select('*')
  }, [])
}
```

---

Correct architecture:

```
Page
 |
 UI Components
 |
 Custom Hooks
 |
 Services
 |
 Supabase
```

Example:

```
EmployeePage
      |
useEmployees()
      |
employeeService.ts
      |
supabase.ts
```

---

# 4. Data Fetching Rules

Never use:

```tsx
useEffect + useState
```

for server data.

Always use:

```
TanStack Query
```

Required:

- useQuery for fetching
- useMutation for create/update/delete
- Query invalidation
- Optimistic updates where appropriate

---

# 5. TypeScript Rules

Strict mode must be enabled.

Forbidden:

```ts
any
```

Never use:

```ts
as unknown as
```

without explanation.

Every database model must have:

```
types.ts
```

Example:

```ts
interface Employee {
  id: string
  companyId: string
  name: string
  role: EmployeeRole
}
```

---

# 6. Forms

All forms must use:

```
React Hook Form
+
Zod
```

The schema must be separated.

Example:

```
employees/
    schemas/
       employee.schema.ts
```

Do not write validation directly inside components.

---

# 7. API and Database Access

All Supabase calls must live inside:

```
services/
```

Example:

```
employees/services/employee.service.ts
```

Never:

```
Supabase inside components
```

---

# 8. Error Handling

Never do:

```ts
console.log(error)
```

Create proper errors.

Every request must handle:

- Loading
- Success
- Error
- Empty state

---

# 9. UI Standards

Use:

- Tailwind CSS
- shadcn/ui
- Framer Motion

Every page requires:

```
Loading State
Skeleton
Empty State
Error State
Success Toast
```

---

# 10. Animation Standards

Allowed:

- fade in
- slight translate Y
- hover scale 1.02
- subtle transitions

Forbidden:

- bouncing elements
- unnecessary rotation
- excessive animations

---

# 11. Security Rules

Never trust frontend permissions.

Frontend:

```
Hide UI
```

Backend:

```
Verify permissions
```

Every database query must respect:

```
company_id
```

No query can expose another company's data.

---

# 12. Environment Rules

Never hardcode:

- API URLs
- Keys
- IDs

Use:

```
.env
```

---

# 13. Naming Standards

Components:

```
EmployeeTable.tsx
EmployeeForm.tsx
EmployeeCard.tsx
```

Hooks:

```
useEmployees.ts
```

Services:

```
employee.service.ts
```

Avoid:

```
helper.ts
utils2.ts
newComponent.tsx
```

---

# 14. Reusability Rules

Before creating a component, check:

```
Can this be reused?
```

Examples:

Reusable:

```
ConfirmDialog
DataTable
EmptyState
ErrorState
PageHeader
```

---

# 15. Performance Standards

Must use:

- React lazy routes
- Code splitting
- Pagination
- Debounced search
- Memoization only when needed

Never load:

```
10000 employees
```

at once.

---

# 16. Accessibility

Every component must support:

- keyboard navigation
- focus states
- ARIA labels where needed
- proper contrast

---

# 17. Testing Requirements

Before marking a task complete, verify:

### Functional Testing

Can the user complete the flow?

Example:

```
Admin
↓
Add employee
↓
Employee appears in table
```

---

### Error Testing

What happens if:

- internet disconnects?
- database fails?
- user has no permission?

---

# 18. Code Review Checklist

Before every PR/task completion, the AI must answer:

```
1. Did I follow feature-based architecture?

2. Did I avoid large components?

3. Did I avoid using any?

4. Are all database calls in services?

5. Are forms using React Hook Form + Zod?

6. Are loading, error, and empty states implemented?

7. Are permissions enforced?

8. Is the code mobile responsive?

9. Are components reusable?

10. Did I introduce duplicate code?
```

---

# How You Will Work With AI Every Day

Never say:

```
Build Employee Management.
```

---

Create a ticket.

Example:

# Ticket HR-001: Employee List Page

## Goal

Create a production-quality employee listing page for the HRMS.

---

## Functional Requirements

Display:

- Employee avatar
- Name
- Email
- Department
- Status
- Joining date
- Actions dropdown

Features:

- Search employees
- Filter by department
- Sort columns
- Pagination

---

## Technical Requirements

Must use:

- TanStack Query
- TypeScript strict mode
- Feature-based architecture
- Service layer
- shadcn DataTable

---

## UX Requirements

Include:

- Table skeleton while loading
- Empty state when no employees exist
- Error state with retry button
- Responsive mobile layout

---

## Acceptance Criteria

The task is complete only if:

```
✓ No TypeScript errors
✓ No console errors
✓ Mobile responsive
✓ Loading state works
✓ Error state works
✓ Query caching works
✓ Code follows architecture
```

---

# The Most Important Advice For You

Since you are using AI, your first 1-2 days should **not be coding features**.

Your first priority should be creating the **engineering system**:

```
Documentation
       ↓
Architecture
       ↓
Coding standards
       ↓
Database design
       ↓
Security rules
       ↓
Reusable components
       ↓
Features
```

Because once the AI starts generating hundreds of files, changing architecture later is a nightmare.

---

## The reality of AI coding in 2026

A bad prompt:

```
Create an HR management system.
```

Result:

```
100 files of spaghetti code.
```

A professional prompt:

```
Here is the architecture, coding standard, security model, and acceptance criteria. Build Ticket HR-001 only.
```

Result:

```
Code that a real engineering team can maintain.
```

For your Indian Business Kit HRMS, I would actually create a **full engineering handbook (like a company uses internally) before generating a single file**. That document will become the brain that controls every AI agent working on your project.
