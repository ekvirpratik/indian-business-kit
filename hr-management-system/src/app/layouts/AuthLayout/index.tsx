import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="w-full max-w-md p-8 bg-background rounded-xl shadow-lg border">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
            <span className="text-primary-foreground font-bold text-xl">IBK</span>
          </div>
          <h1 className="text-2xl font-bold">HR Management System</h1>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
