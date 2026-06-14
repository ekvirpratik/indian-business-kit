export const ROUTES = {
  HOME: "/",
  LOGIN: "/sign-in",
  REGISTER: "/sign-up",
  INVITATION: "/invite/:token",
  UNAUTHORIZED: "/403",
  DASHBOARD: "/dashboard",
  EMPLOYEES: "/employees",
  ATTENDANCE: "/attendance",
  LEAVES: "/leaves",
  SETTINGS: "/settings",

  // Dev routes
  DESIGN_SYSTEM: "/dev/design-system",
} as const;
