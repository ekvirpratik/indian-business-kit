import { AlertCircle } from 'lucide-react';

interface GlobalErrorProps {
  error?: Error;
  errorId?: string;
  resetErrorBoundary?: () => void;
}

export function GlobalError({ errorId, resetErrorBoundary }: GlobalErrorProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="text-muted-foreground">
            We couldn't load this page. An unexpected error occurred.
          </p>
          {errorId && (
            <p className="text-xs text-muted-foreground/60 font-mono mt-2">
              Error ID: {errorId}
            </p>
          )}
        </div>

        <div className="flex w-full flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          {resetErrorBoundary && (
            <button
              onClick={resetErrorBoundary}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
