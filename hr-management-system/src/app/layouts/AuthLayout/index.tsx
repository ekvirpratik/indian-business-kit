import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background">
      {/* Branding Section */}
      <div className="hidden md:flex flex-col justify-between p-12 bg-primary text-primary-foreground">
        <div>
          <div className="flex items-center gap-3 font-bold text-2xl mb-12">
            <div className="w-10 h-10 bg-primary-foreground text-primary rounded-lg flex items-center justify-center">
              IBK
            </div>
            HR Management System
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-6">
            Empower Your Workplace
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Streamline employee management, track attendance, and simplify leave requests in one unified platform.
          </p>
        </div>
        <div className="text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} Indian Business Kit. All rights reserved.
        </div>
      </div>

      {/* Form Section */}
      <div className="flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center md:items-start text-center md:text-left mb-8 md:hidden">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4 text-primary-foreground font-bold text-xl">
              IBK
            </div>
            <h2 className="text-2xl font-bold">HR Management System</h2>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
