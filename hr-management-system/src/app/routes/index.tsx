import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ROUTES } from '@/constants/routes';
import { AuthGuard, GuestGuard, RoleGuard } from './guards/RouteGuard';
import { PageSkeleton } from '@/components/skeletons/PageSkeleton';
import { isDev } from '@/lib/env';

// Layouts
import AuthLayout from '@/app/layouts/AuthLayout';
import DashboardLayout from '@/app/layouts/DashboardLayout';

// Lazy Loaded Pages
const SignInPage = lazy(() => import('@/features/auth/pages/SignInPage'));
const SignUpPage = lazy(() => import('@/features/auth/pages/SignUpPage'));
const PostAuthPage = lazy(() => import('@/features/auth/pages/PostAuthPage'));
const InvitationPage = lazy(() => import('@/features/auth/pages/InvitationPage'));
const CreateCompanyPage = lazy(() => import('@/features/auth/pages/CreateCompanyPage'));
const SubscriptionRequiredPage = lazy(() => import('@/features/core/pages/SubscriptionRequiredPage'));
const AccessSuspendedPage = lazy(() => import('@/features/core/pages/AccessSuspendedPage'));

const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const EmployeesPage = lazy(() => import('@/features/employees/pages/EmployeesPage'));
const AttendancePage = lazy(() => import('@/features/attendance/pages/AttendancePage'));
const LeavesPage = lazy(() => import('@/features/leaves/pages/LeavesPage'));
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'));
const DesignSystemPage = lazy(() => import('@/features/dev/pages/DesignSystemPage'));
const NotFoundPage = lazy(() => import('@/features/core/pages/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('@/features/core/pages/UnauthorizedPage'));

const SuspenseLayout = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },
  // Post-Authentication Gateway
  {
    path: ROUTES.POST_AUTH,
    element: <SuspenseLayout><PostAuthPage /></SuspenseLayout>,
  },
  // Public & Guest Auth Pages
  {
    path: '/',
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
    ],
  },
  // Invitation flow (supports both guests and authenticated users)
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: ROUTES.INVITATION,
        element: <SuspenseLayout><InvitationPage /></SuspenseLayout>,
      },
    ],
  },
  // Onboarding & Entitlement Resolution Pages
  {
    path: ROUTES.ONBOARDING_CREATE_COMPANY,
    element: <SuspenseLayout><CreateCompanyPage /></SuspenseLayout>,
  },
  {
    path: ROUTES.SUBSCRIPTION_REQUIRED,
    element: <SuspenseLayout><SubscriptionRequiredPage /></SuspenseLayout>,
  },
  {
    path: ROUTES.ACCESS_SUSPENDED,
    element: <SuspenseLayout><AccessSuspendedPage /></SuspenseLayout>,
  },
  // Protected Dashboard Application
  {
    path: '/',
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
          <RoleGuard roles={['super_admin', 'company_admin', 'manager']}>
            <SuspenseLayout><EmployeesPage /></SuspenseLayout>
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.ATTENDANCE,
        element: (
          <RoleGuard roles={['super_admin', 'company_admin', 'manager', 'employee']}>
            <SuspenseLayout><AttendancePage /></SuspenseLayout>
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.LEAVES,
        element: (
          <RoleGuard roles={['super_admin', 'company_admin', 'manager', 'employee']}>
            <SuspenseLayout><LeavesPage /></SuspenseLayout>
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.SETTINGS,
        element: (
          <RoleGuard roles={['super_admin', 'company_admin']}>
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
  ...(isDev
    ? [
        {
          path: ROUTES.DESIGN_SYSTEM,
          element: <SuspenseLayout><DesignSystemPage /></SuspenseLayout>,
        },
      ]
    : []),
  {
    path: '*',
    element: <SuspenseLayout><NotFoundPage /></SuspenseLayout>,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
