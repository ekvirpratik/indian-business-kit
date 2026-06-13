Bro, since you are using AI agents, **today is not "coding day"**. Today is **Architecture & Foundation Day**.

The goal of Day 1 is:

> "By the end of today, we should have a beautiful, production-ready foundation where any future feature can be added without changing the architecture."

You are basically creating the **company rules, workspace, and engineering foundation** before hiring your AI developers.

---

# 📅 Day 1 — Foundation, Architecture & Design System

## Expected Outcome

By end of today:

```
✔ React application initialized
✔ TypeScript strict mode enabled
✔ Tailwind configured
✔ shadcn installed
✔ Framer Motion installed
✔ TanStack Query configured
✔ Routing structure created
✔ Application layouts created
✔ Theme system working
✔ Design system created
✔ Base reusable components created
✔ Error handling structure created
✔ Environment configuration ready
✔ Documentation added
✔ Git repository configured
```

---

# 🎫 TICKET HR-001

# Initialize Project Foundation

## Priority

P0 — Critical

---

## Objective

Create the initial HRMS application with all required dependencies and development tooling.

---

## Requirements

Create project:

```
React 19
Vite
TypeScript
```

Install:

### Styling

- Tailwind CSS
- tailwind-merge
- clsx

---

### UI

- shadcn/ui
- Lucide Icons

---

### Animation

- Framer Motion
- Magic UI

---

### Data & State

- TanStack Query

---

### Forms

- React Hook Form
- Zod
- @hookform/resolvers

---

### Authentication

- Clerk SDK

---

### Database

- Supabase JavaScript Client

---

### Developer Experience

Install:

- ESLint
- Prettier
- TypeScript strict mode
- Husky
- lint-staged

---

## Acceptance Criteria

```
✓ Project runs without errors
✓ npm run dev works
✓ npm run build succeeds
✓ TypeScript strict mode enabled
✓ Linting configured
✓ Formatting configured
```

---

---

# 🎫 TICKET HR-002

# Setup Project Architecture

## Priority

P0

---

## Objective

Create the complete folder structure according to ARCHITECTURE.md.

---

## Create:

```
src/
│
├── app/
│   ├── router/
│   ├── providers/
│   └── layouts/
│
├── components/
│   ├── ui/
│   ├── shared/
│   ├── feedback/
│   └── skeletons/
│
├── features/
│
├── hooks/
│
├── lib/
│   ├── supabase/
│   ├── clerk/
│
├── constants/
│
├── types/
│
├── utils/
```

---

## Configure

Path aliases:

```
@/components
@/features
@/lib
@/hooks
```

---

## Acceptance Criteria

```
✓ Folder structure exists
✓ Imports use aliases
✓ No relative import hell
```

---

# 🎫 TICKET HR-003

# Configure Environment System

## Priority

P0

---

## Objective

Create a secure environment variable structure.

---

## Create

```
.env.example
.env.local
```

---

## Variables:

```
VITE_APP_NAME=

VITE_CLERK_PUBLISHABLE_KEY=

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## Rules

- No secrets in Git
- Add `.env` to `.gitignore`
- Document environment setup

---

## Acceptance Criteria

```
✓ Environment files created
✓ Variables are typed
✓ No hardcoded URLs
```

---

# 🎫 TICKET HR-004

# Configure Application Providers

## Priority

P0

---

## Create providers for:

```
Query Client
Theme Provider
Clerk Provider
React Router
```

---

## Requirements

Create:

```
src/app/providers/
```

---

Each provider should be isolated.

Example:

```
QueryProvider.tsx

ThemeProvider.tsx

AuthProvider.tsx
```

---

## Acceptance Criteria

```
✓ Providers are separated
✓ Main.tsx remains clean
✓ No huge setup files
```

---

# 🎫 TICKET HR-005

# Setup Routing Architecture

## Priority

P0

---

## Create route structure:

```
/
│
├── auth
│   ├── sign-in
│   └── sign-up
│
├── dashboard
│
├── employees
│
├── attendance
│
├── leaves
│
├── departments
│
├── settings
│
└── invite/:token
```

---

## Requirements

- Use React Router v7
- Lazy load pages
- Create route constants
- Create protected route wrappers

---

## Acceptance Criteria

```
✓ Routes work
✓ Lazy loading enabled
✓ 404 page exists
```

---

# 🎫 HR-006

# Create Global Layout System

## Priority

P0

---

## Create:

```
AppLayout
AuthLayout
DashboardLayout
```

---

Dashboard layout should include:

```
Sidebar
Top Navbar
Main Content Area
```

---

Requirements:

Sidebar:

- Collapsible
- Animated
- Active route highlighting
- Mobile drawer support

Navbar:

- Page title
- Search placeholder
- Notification button
- Profile dropdown
- Theme switch

---

Use:

```
Framer Motion
shadcn components
```

---

## Acceptance Criteria

```
✓ Responsive layout works
✓ Sidebar animation works
✓ Mobile navigation works
```

---

# 🎫 TICKET HR-007

# Create Design System

## Priority

P0

---

## Follow UI_GUIDELINES.md

---

## Create base components:

### Buttons

```
Primary
Secondary
Ghost
Danger
```

---

### Inputs

```
Text
Email
Password
Search
```

---

### Cards

```
Stat Card
Information Card
Empty Card
```

---

### Feedback

```
EmptyState
ErrorState
LoadingState
```

---

### Dialogs

```
Confirmation Dialog
Modal Wrapper
```

---

## Acceptance Criteria

```
✓ Components are reusable
✓ Dark mode works
✓ Styling is consistent
```

---

# 🎫 TICKET HR-008

# Create Skeleton Loading System

## Priority

P1

---

## Create:

```
DashboardSkeleton
TableSkeleton
CardSkeleton
ProfileSkeleton
FormSkeleton
```

---

## Requirements

Skeletons must:

- Match final UI dimensions
- Prevent layout shift
- Support dark mode

---

## Acceptance Criteria

```
✓ No "Loading..." pages
✓ Skeletons are reusable
```

---

# 🎫 TICKET HR-009

# Configure Error Handling & Notifications

## Priority

P1

---

## Setup:

```
Toast System
Error Boundaries
Fallback UI
```

---

## User errors:

Example:

```
Invalid email
```

---

## System errors:

Example:

```
Unable to connect.
Please try again.
```

---

## Acceptance Criteria

```
✓ App never crashes to blank screen
✓ Errors are user-friendly
```

---

# 🎫 TICKET HR-010

# Repository Standards & Documentation

## Priority

P1

---

## Create:

```
README.md

docs/
 ├── PRODUCT.md
 ├── ARCHITECTURE.md
 ├── DATABASE.md
 ├── SECURITY.md
 ├── CODING_STANDARDS.md
 └── UI_GUIDELINES.md
```

---

## Setup:

```
.gitignore
```

---

## Add:

- Installation instructions
- Environment setup
- Development commands

---

## Acceptance Criteria

```
✓ New developer can clone and run the project
✓ Documentation exists
```

---

# 🚀 Day 1 Execution Order

Do not ask the AI to do everything at once.

Follow this sequence:

```
HR-001
 ↓
HR-002
 ↓
HR-003
 ↓
HR-004
 ↓
HR-005
 ↓
HR-006
 ↓
HR-007
 ↓
HR-008
 ↓
HR-009
 ↓
HR-010
```

---

# 🧪 End of Day 1 Quality Checklist

Before moving to Day 2:

```
Architecture
☐ Feature-based folders exist
☐ No random files

Code Quality
☐ TypeScript strict mode
☐ ESLint passing
☐ Prettier working

UI
☐ Dark/light mode
☐ Responsive sidebar
☐ Layout animations
☐ Reusable components

Performance
☐ Lazy routing
☐ Code splitting

Security
☐ Environment variables configured
☐ No secrets in code

Developer Experience
☐ Documentation complete
☐ Clean imports
```

---

# Important Rule for Today

**Do not allow the AI to build employees, attendance, authentication, or database logic today.**

Many developers rush into features and later rewrite everything.

Today you are building the **foundation that the next 6 days will stand on**.

---

Bro, after Day 1, your project should already look like a **premium SaaS shell** (beautiful sidebar, topbar, dark mode, routing, animations, skeletons), even though no business data exists yet.

Tomorrow (Day 2) we will move into **Supabase Database, Multi-Tenant Architecture, RLS, Clerk integration strategy, and security foundation**. 🚀
