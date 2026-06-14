import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { sidebarItems } from "@/constants/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const { user } = useAuth();
  const userRole = user?.app_metadata?.role as string || "employee";
  
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebarExpanded");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("sidebarExpanded", JSON.stringify(expanded));
  }, [expanded]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: expanded ? 280 : 80 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="hidden md:flex flex-col border-r bg-background/95 h-screen sticky top-0 z-40 overflow-hidden"
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        <motion.div
          animate={{ opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className={cn(
            "font-bold text-lg text-primary whitespace-nowrap overflow-hidden transition-all",
            !expanded && "w-0"
          )}
        >
          IBK HRMS
        </motion.div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setExpanded(!expanded)}
          className={cn("flex-shrink-0", expanded ? "ml-auto" : "mx-auto")}
        >
          {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 py-4">
        <nav className="grid gap-2 px-2">
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
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-muted overflow-hidden",
                    isActive ? "bg-muted text-primary font-medium" : "text-muted-foreground",
                    !expanded && "justify-center"
                  )
                }
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <motion.span
                  animate={{ opacity: expanded ? 1 : 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className={cn("whitespace-nowrap transition-all", !expanded && "w-0 hidden")}
                >
                  {item.title}
                </motion.span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </motion.aside>
  );
}
