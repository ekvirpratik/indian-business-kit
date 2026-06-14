import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full max-w-full">
        <TopNav />
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-6 md:gap-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
