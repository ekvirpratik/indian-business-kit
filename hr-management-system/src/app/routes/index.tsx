import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ROUTES } from "@/constants/routes";
import { AuthGuard, GuestGuard, RoleGuard } from "./guards/RouteGuard";
import { PageSkeleton } from "@/components/skeletons/PageSkeleton";

// Layouts
import AuthLayout from "@/app/layouts/AuthLayout";
import DashboardLayout from "@/app/layouts/DashboardLayout";

// Lazy Loaded Pages
const SignInPage = lazy(() => import("@/features/auth/pages/SignInPage"));
const SignUpPage = lazy(() => import("@/features/auth/pages/SignUpPage"));
const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage"));
const EmployeesPage = lazy(() => import("@/features/employees/pages/EmployeesPage"));
const AttendancePage = lazy(() => import("@/features/attendance/pages/AttendancePage"));
const LeavesPage = lazy(() => import("@/features/leaves/pages/LeavesPage"));
const SettingsPage = lazy(() => import("@/features/settings/pages/SettingsPage"));
const DesignSystemPage = lazy(() => import("@/features/dev/pages/DesignSystemPage"));
const NotFoundPage = lazy(() => import("@/features/core/pages/NotFoundPage"));
const UnauthorizedPage = lazy(() => import("@/features/core/pages/UnauthorizedPage"));

// For invitation page, using SignUpPage as placeholder for now
const InvitationPage = lazy(() => import("@/features/auth/pages/SignUpPage"));

const SuspenseLayout = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
);

import { isDev } from "@/lib/env";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },
  {
    path: "/",
    element: (
      <GuestGuard>
        <AuthLayout />
      </GuestGuard>
    ),
    children: [
      {
        path: ROUTES.LOGIN,
        element: <SuspenseLayout><SignInPage /></SuspenseLayout>,
      },
      {
        path: ROUTES.REGISTER,
        element: <SuspenseLayout><SignUpPage /></SuspenseLayout>,
      },
      {
        path: ROUTES.INVITATION,
        element: <SuspenseLayout><InvitationPage /></SuspenseLayout>,
      },
    ],
  },
  {
    path: "/",
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: ROUTES.DASHBOARD,
        element: <SuspenseLayout><DashboardPage /></SuspenseLayout>,
      },
      {
        path: ROUTES.EMPLOYEES,
        element: (
          <RoleGuard roles={["company_admin", "manager"]}>
            <SuspenseLayout><EmployeesPage /></SuspenseLayout>
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.ATTENDANCE,
        element: (
          <RoleGuard roles={["company_admin", "manager", "employee"]}>
            <SuspenseLayout><AttendancePage /></SuspenseLayout>
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.LEAVES,
        element: (
          <RoleGuard roles={["company_admin", "manager", "employee"]}>
            <SuspenseLayout><LeavesPage /></SuspenseLayout>
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.SETTINGS,
        element: (
          <RoleGuard roles={["company_admin"]}>
            <SuspenseLayout><SettingsPage /></SuspenseLayout>
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.UNAUTHORIZED,
        element: <SuspenseLayout><UnauthorizedPage /></SuspenseLayout>,
      },
    ],
  },
  ...(isDev ? [{
    path: ROUTES.DESIGN_SYSTEM,
    element: <SuspenseLayout><DesignSystemPage /></SuspenseLayout>,
  }] : []),
  {
    path: "*",
    element: <SuspenseLayout><NotFoundPage /></SuspenseLayout>,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
