import { toast } from 'sonner';

/**
 * Maps common database/API error codes or messages to user-friendly text.
 */
function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    
    // Example Supabase/Postgres errors
    if (msg.includes('duplicate key value') || msg.includes('already exists')) {
      return 'A record with this information already exists.';
    }
    if (msg.includes('jwt') || msg.includes('unauthorized')) {
      return 'Your session has expired or is invalid. Please log in again.';
    }
    
    // Fallback generic message for production
    return 'Something went wrong. Please try again later.';
  }
  
  // Return generic for string errors or other types
  return 'Something went wrong. Please try again later.';
}

/**
 * Centralized error handler for mutations and API requests.
 */
export function handleError(error: unknown, customMessage?: string) {
  // eslint-disable-next-line no-console
  console.error('[Error Handler]:', error);

  const friendlyMessage = customMessage || getFriendlyErrorMessage(error);
  
  // Here we would trigger a toast notification (e.g., Sonner or react-hot-toast)
  // Assumes a toast library will be integrated later. If `toast` is available, it will run.
  if (typeof toast !== 'undefined' && toast.error) {
    toast.error(friendlyMessage);
  } else {
    // Fallback if no toast library
    alert(friendlyMessage);
  }
}
