import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const INVITE_TOKEN_STORAGE_KEY = 'peakhr_invite_token';

/**
 * Manages invitation token preservation across Clerk authentication redirects.
 * Uses sessionStorage (temporary tab session) so tokens are not permanently stored.
 */
export function useInvitationToken() {
  const { token: urlToken } = useParams<{ token?: string }>();
  const [storedToken, setStoredTokenState] = useState<string | null>(() => {
    return sessionStorage.getItem(INVITE_TOKEN_STORAGE_KEY);
  });

  // If token is found in the current URL, preserve it in sessionStorage
  useEffect(() => {
    if (urlToken && urlToken.trim().length > 0) {
      sessionStorage.setItem(INVITE_TOKEN_STORAGE_KEY, urlToken);
    }
  }, [urlToken]);

  const setInviteToken = useCallback((token: string) => {
    sessionStorage.setItem(INVITE_TOKEN_STORAGE_KEY, token);
    setStoredTokenState(token);
  }, []);

  const clearInviteToken = useCallback(() => {
    sessionStorage.removeItem(INVITE_TOKEN_STORAGE_KEY);
    setStoredTokenState(null);
  }, []);

  // Effective token is either current URL param or preserved session token
  const effectiveToken = urlToken || storedToken || null;

  return {
    token: effectiveToken,
    setInviteToken,
    clearInviteToken,
  };
}

/**
 * Non-hook helper for reading preserved invite token outside React components.
 */
export function getPreservedInviteToken(): string | null {
  return sessionStorage.getItem(INVITE_TOKEN_STORAGE_KEY);
}

export function clearPreservedInviteToken(): void {
  sessionStorage.removeItem(INVITE_TOKEN_STORAGE_KEY);
}
