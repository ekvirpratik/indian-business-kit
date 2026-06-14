import { Home, Users, Calendar, Clock, Settings } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export const sidebarItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: ROUTES.DASHBOARD,
    roles: ["company_admin", "manager"],
  },
  {
    title: "Employees",
    icon: Users,
    href: ROUTES.EMPLOYEES,
    roles: ["company_admin", "manager"],
  },
  {
    title: "Attendance",
    icon: Clock,
    href: ROUTES.ATTENDANCE,
    roles: ["company_admin", "manager", "employee"],
  },
  {
    title: "Leaves",
    icon: Calendar,
    href: ROUTES.LEAVES,
    roles: ["company_admin", "manager", "employee"],
  },
  {
    title: "Settings",
    icon: Settings,
    href: ROUTES.SETTINGS,
    roles: ["company_admin"],
  },
];
