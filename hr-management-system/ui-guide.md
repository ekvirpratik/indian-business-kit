# UI_GUIDELINES.md

# Indian Business Kit HRMS — Design System & User Experience Standards

---

# 1. Design Philosophy

The HRMS is a premium SaaS product inside the Indian Business Kit ecosystem.

The design must balance:

- Professional enterprise quality.
- Simple experience for Indian small businesses.
- Fast and intuitive workflows.
- Mobile-first usability.

The user should feel:

- "This is easy to use."
- "This saves me time."
- "This feels like premium software."

---

## Design Inspiration

The product should have the feeling of:

- Modern SaaS dashboards.
- Clean productivity tools.
- Minimal business applications.

Inspired by:

- Linear
- Stripe Dashboard
- Notion

---

## Avoid

Never create:

- Overly colorful dashboards.
- Excessive gradients.
- Too many shadows.
- Heavy glassmorphism.
- Complex navigation.
- Too many animations.
- Large empty spaces.
- Unnecessary visual effects.

---

# 2. Color System

The application must support both light and dark themes.

---

## Primary Brand Color

Primary action color:

- Indigo 600

Used for:

- Primary buttons.
- Active navigation.
- Links.
- Important actions.
- Selected states.

---

## Neutral Colors

Light Mode:

Background:

- White.
- Slate 50.

Cards:

- White.

Text:

- Slate 900.

Secondary text:

- Slate 500.

Borders:

- Slate 200.

---

Dark Mode:

Background:

- Slate 950.

Cards:

- Slate 900.

Text:

- Slate 100.

Secondary text:

- Slate 400.

Borders:

- Slate 800.

---

## Status Colors

Success:

- Emerald

Examples:

- Attendance present.
- Approved leave.
- Successful actions.

---

Warning:

- Amber

Examples:

- Pending approval.
- Expiring invitations.

---

Danger:

- Red or Rose

Examples:

- Delete actions.
- Errors.
- Rejected leave.

---

Information:

- Sky Blue

Examples:

- Notices.
- Information messages.

---

# 3. Typography

Preferred fonts:

- Inter.
- Geist.

---

## Text Hierarchy

Page Titles:

- Large.
- Bold.
- High contrast.

Examples:

Employee Management

Attendance Dashboard

---

Section Titles:

- Medium size.
- Semi-bold.

---

Body Text:

- Easy to read.
- Comfortable line height.

---

Labels:

- Smaller.
- Clear.
- Never too light.

---

Never:

- Use more than two font families.
- Use decorative fonts.
- Use tiny unreadable text.

---

# 4. Layout System

The layout must be consistent throughout the application.

---

## Desktop Layout

Structure:

```
Sidebar
   |
Main Content
   |
Top Navigation
   |
Page Content
```

---

## Sidebar

The sidebar is the primary navigation.

It must:

- Be collapsible.
- Support icons.
- Highlight active route.
- Animate smoothly.
- Work as a drawer on mobile.

---

Main navigation:

- Dashboard.
- Employees.
- Attendance.
- Leave Management.
- Departments.
- Settings.

---

Sidebar Components:

Top:

- Company logo.
- Company name.

Middle:

- Navigation links.

Bottom:

- User profile.
- Theme switch.
- Logout.

---

## Top Navigation

Contains:

- Page title.
- Search.
- Notifications.
- User menu.
- Company information if required.

---

# 5. Responsive Design

Mobile-first design is mandatory.

---

## Mobile

Navigation:

- Drawer sidebar.

Design rules:

- Full-width cards.
- Large touch targets.
- Simple forms.
- Minimal scrolling.

---

## Tablet

- Collapsible sidebar.
- Adjusted grid layouts.

---

## Desktop

- Multi-column dashboards.
- More detailed tables.
- Side-by-side layouts.

---

Supported breakpoints:

- 320px.
- 768px.
- 1024px.
- 1440px.

---

# 6. Dashboard Design Standards

The dashboard should provide useful information immediately.

Avoid showing too many charts.

---

## Welcome Section

Example:

Good Morning, Rahul 👋

ABC Store Overview

---

Include:

- Current date.
- Quick actions.

Examples:

- Add Employee.
- Mark Attendance.
- View Reports.

---

## Statistics Cards

Examples:

- Total Employees.
- Present Today.
- Absent.
- Pending Leaves.

Every card should include:

- Icon.
- Title.
- Main value.
- Optional trend.

---

Animations:

- Fade in.
- Slight upward movement.
- Staggered appearance.

---

# 7. Data Tables

Tables are one of the most important components.

Modules:

- Employees.
- Attendance.
- Leaves.
- Departments.

---

Every table must support:

- Search.
- Filtering.
- Sorting.
- Pagination.
- Loading state.
- Empty state.
- Error state.

---

Desktop:

Show full table.

---

Mobile:

Convert tables into:

- Cards.
- Stacked information.

---

Never:

Display a large horizontal scrolling table on small devices.

---

# 8. Forms

All forms must use:

- shadcn Form components.
- React Hook Form.
- Zod validation.

---

Every form must include:

- Labels.
- Placeholder examples.
- Validation messages.
- Proper spacing.

---

Example:

Employee Name:

✓ Correct:

Rahul Sharma

---

Email:

✓ Correct:

[rahul@example.com](mailto:rahul@example.com)

---

## Form Submission

Do not use skeletons.

Use:

- Disabled submit button.
- Loading spinner.
- Progress feedback.

Example:

Saving Employee...

---

# 9. Buttons

Button variants:

Primary:

- Indigo background.
- White text.

Secondary:

- Outline style.

Danger:

- Red.

Ghost:

- Minimal actions.

---

Hover Effects:

Allowed:

- Slight scale increase.
- Soft shadow.

---

Click:

Small press animation.

---

Avoid:

- Bouncing buttons.
- Extreme scaling.
- Flashy effects.

---

# 10. Dialogs & Drawers

Used for:

- Adding employees.
- Editing information.
- Confirming deletion.
- Viewing details.

---

Animation:

Open:

- Fade in.
- Scale 95% → 100%.

Close:

- Fade out.

---

Backdrop:

- Slight blur.
- Dark transparent overlay.

---

# 11. Loading Experience

The application must never feel empty.

---

## Skeleton Loading

Use skeletons for:

- Dashboard cards.
- Employee tables.
- Profiles.
- Charts.
- Settings.

---

Do not use:

```
Loading...
```

for complete pages.

---

Skeletons should match the final layout.

Bad:

```
Loading...
```

Page suddenly appears.

---

Good:

```
Card Skeleton
Table Skeleton
Profile Skeleton
```

No layout shift.

---

# 12. Empty States

Every module must have meaningful empty states.

Example:

Employees:

No employees added yet.

Action:

Add your first employee.

---

Leave Requests:

No pending leave requests.

---

Include:

- Friendly icon.
- Helpful message.
- Clear action button.

---

# 13. Error States

Never show technical errors.

Bad:

```
ERROR 500
Database query failed
```

---

Good:

```
Unable to load employees.

Please try again.
```

Include:

- Retry button.
- Helpful explanation.

---

# 14. Notifications & Feedback

Use Toasts for:

- Employee created.
- Employee updated.
- Leave approved.
- Errors.
- Successful imports.

---

Notifications should:

- Appear briefly.
- Be dismissible.
- Not block the user.

---

# 15. Animation Standards

Animations must support the experience.

The user should notice smoothness, not animation.

---

## Framer Motion Standards

Page transition:

Initial:

- opacity: 0
- y: 15px

Animate:

- opacity: 1
- y: 0

Duration:

- 0.3 to 0.4 seconds.

---

Cards:

Hover:

- Scale 1.02.
- Slight shadow increase.

---

Lists:

- Use staggered animations.

---

Avoid:

- Large rotations.
- Bouncing elements.
- Long animation delays.

---

# 16. Magic UI Usage Rules

Magic UI should be used only for premium touches.

Good usage:

- Empty states.
- Dashboard hero section.
- Special cards.
- Loading effects.

---

Do not use:

- Animated backgrounds everywhere.
- Glowing effects on every card.
- Distracting animations.

---

The goal is professionalism.

---

# 17. Accessibility Standards

Every interface must support:

- Keyboard navigation.
- Visible focus states.
- Screen readers.
- Proper contrast.
- ARIA labels where required.

---

Do not communicate information using color only.

Example:

Bad:

Red badge means rejected.

Good:

Red badge + text:

Rejected.

---

# 18. Performance & UX Standards

The application must feel fast.

Use:

- Lazy-loaded routes.
- Query caching.
- Skeleton loading.
- Optimistic updates where appropriate.

---

Avoid:

- Blocking the UI.
- Large unnecessary animations.
- Loading the entire database.

---

# 19. Design Consistency Rules

AI agents must always reuse existing components.

Never create:

- Five different button styles.
- Multiple card designs for the same purpose.
- Different spacing systems.
- Different table layouts.

---

Before creating a new component ask:

"Can this be built using an existing design pattern?"

---

# 20. Page Completion Checklist

A page is complete only when it has:

✓ Responsive design.

✓ Proper spacing.

✓ Correct typography.

✓ Loading skeleton.

✓ Empty state.

✓ Error state.

✓ Success feedback.

✓ Accessibility support.

✓ Smooth animations.

✓ Dark mode support.

✓ Mobile usability.

---

# Final Design Principle

The HRMS should feel like a product built by a professional SaaS company.

The user should never think:

"This is a website."

The user should feel:

"This is my business management application."

Every pixel, animation, loading state, and interaction should have a purpose.

Simplicity is the ultimate premium experience.
