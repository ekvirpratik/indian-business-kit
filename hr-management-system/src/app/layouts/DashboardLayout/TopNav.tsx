import { UserNav } from "./UserNav";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Fragment } from "react";

function DynamicBreadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <nav className="hidden md:flex ml-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
        <li>
          <Link to={ROUTES.DASHBOARD} className="hover:text-foreground transition-colors flex items-center">
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          const title = value.charAt(0).toUpperCase() + value.slice(1);

          return (
            <Fragment key={to}>
              <ChevronRight className="h-4 w-4" />
              <li>
                {isLast ? (
                  <span className="font-medium text-foreground">{title}</span>
                ) : (
                  <Link to={to} className="hover:text-foreground transition-colors">
                    {title}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 flex h-14 w-full items-center border-b bg-background/95 px-4 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        <MobileNav />
        <DynamicBreadcrumbs />
      </div>
      <div className="flex flex-1 items-center justify-end space-x-4">
        <div className="hidden md:flex">
          <ThemeToggle />
        </div>
        <UserNav />
      </div>
    </header>
  );
}
