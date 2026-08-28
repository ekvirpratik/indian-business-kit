import { Home, Users, Calendar, Clock, Settings } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { ROLES, ADMIN_ROLES, MANAGER_ROLES } from '@/constants/roles';

export const sidebarItems = [
  {
    title: 'Dashboard',
    icon: Home,
    href: ROUTES.DASHBOARD,
    roles: [ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE],
  },
  {
    title: 'Employees',
    icon: Users,
    href: ROUTES.EMPLOYEES,
    roles: MANAGER_ROLES,
  },
  {
    title: 'Attendance',
    icon: Clock,
    href: ROUTES.ATTENDANCE,
    roles: [ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE],
  },
  {
    title: 'Leaves',
    icon: Calendar,
    href: ROUTES.LEAVES,
    roles: [ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE],
  },
  {
    title: 'Settings',
    icon: Settings,
    href: ROUTES.SETTINGS,
    roles: ADMIN_ROLES,
  },
];
