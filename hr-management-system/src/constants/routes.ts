export const ROUTES = {
  // Public
  HOME: '/',

  // Auth (GuestGuard)
  LOGIN: '/sign-in',
  REGISTER: '/sign-up',

  // Invitation flow — token preserved through auth
  INVITATION: '/invite/:token',

  // Post-auth gateway — single place that resolves onboarding state
  POST_AUTH: '/auth/callback',

  // Onboarding flows
  ONBOARDING_CREATE_COMPANY: '/onboarding/create-company',
  SUBSCRIPTION_REQUIRED: '/subscription-required',
  ACCESS_SUSPENDED: '/access-suspended',

  // Error pages
  UNAUTHORIZED: '/403',

  // Protected (AuthGuard)
  DASHBOARD: '/dashboard',
  EMPLOYEES: '/employees',
  ATTENDANCE: '/attendance',
  LEAVES: '/leaves',
  SETTINGS: '/settings',

  // Dev routes (dev only)
  DESIGN_SYSTEM: '/dev/design-system',
} as const;
