import { AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";

interface ApiErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ApiErrorState({
  title = "Failed to load data",
  message = "An error occurred while fetching information. Please try again.",
  onRetry,
  className,
}: ApiErrorStateProps) {
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={message}
      action={
        onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Try Again
          </Button>
        )
      }
      className={className}
    />
  );
}
