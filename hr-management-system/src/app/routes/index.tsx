import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import { AuthGuard, GuestGuard, RoleGuard } from "./guards/RouteGuard";

// Layouts
import AuthLayout from "@/app/layouts/AuthLayout";
import DashboardLayout from "@/app/layouts/DashboardLayout";

// Placeholder Pages
import SignInPage from "@/features/auth/pages/SignInPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import EmployeesPage from "@/features/employees/pages/EmployeesPage";
import AttendancePage from "@/features/attendance/pages/AttendancePage";
import LeavesPage from "@/features/leaves/pages/LeavesPage";
import SettingsPage from "@/features/settings/pages/SettingsPage";
import NotFoundPage from "@/features/core/pages/NotFoundPage";

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
        element: <SignInPage />,
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
        element: <DashboardPage />,
      },
      {
        path: ROUTES.EMPLOYEES,
        element: (
          <RoleGuard roles={["company_admin", "manager"]}>
            <EmployeesPage />
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.ATTENDANCE,
        element: (
          <RoleGuard roles={["company_admin", "manager", "employee"]}>
            <AttendancePage />
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.LEAVES,
        element: (
          <RoleGuard roles={["company_admin", "manager", "employee"]}>
            <LeavesPage />
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.SETTINGS,
        element: (
          <RoleGuard roles={["company_admin"]}>
            <SettingsPage />
          </RoleGuard>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
