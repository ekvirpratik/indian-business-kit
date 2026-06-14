import { ROUTES } from "@/config/routes";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-muted-foreground mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        to={ROUTES.DASHBOARD}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
