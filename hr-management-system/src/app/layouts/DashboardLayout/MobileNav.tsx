import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { sidebarItems } from "@/constants/navigation";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/providers/AuthProvider";
import { ThemeToggle } from "@/components/ui/theme-toggle"; // We'll assume ThemeToggle will be created

export function MobileNav() {
  const { user } = useAuth();
  const userRole = user?.app_metadata?.role as string || "employee";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] flex flex-col p-0">
        <div className="flex h-14 items-center border-b px-6">
          <div className="font-bold text-lg text-primary">IBK HRMS</div>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid gap-1 px-4">
            {sidebarItems.map((item) => {
              if (item.roles && !item.roles.includes(userRole)) {
                return null;
              }
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                      isActive ? "bg-muted text-primary" : "text-muted-foreground"
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </NavLink>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t flex justify-between items-center">
           <span className="text-sm font-medium text-muted-foreground">Theme</span>
           <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
