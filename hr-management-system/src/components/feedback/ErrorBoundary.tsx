import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { GlobalError } from './GlobalError';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Generate a simple unique ID for tracking the error instance
    const errorId = Math.random().toString(36).substring(2, 9);
    return { hasError: true, error, errorId };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    // In the future, this is where we would report to Sentry or another tracking service
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <GlobalError 
          error={this.state.error} 
          errorId={this.state.errorId} 
          resetErrorBoundary={this.handleReset} 
        />
      );
    }

    return this.props.children;
  }
}
