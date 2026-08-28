import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useInvitationToken } from '@/features/auth/hooks/useInvitationToken';
import { Loader2 } from 'lucide-react';

/**
 * Post-Authentication Gateway:
 * Single centralized page that inspects the loaded profile and entitlement state
 * and redirects the user to the correct product destination.
 */
export default function PostAuthPage() {
  const navigate = useNavigate();
  const { isLoading, isSignedIn, onboardingState } = useCurrentUser();
  const { token: invitationToken } = useInvitationToken();

  useEffect(() => {
    if (isLoading) return;

    if (!isSignedIn) {
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }

    switch (onboardingState) {
      case 'needs_invitation':
        if (invitationToken) {
          navigate(`/invite/${invitationToken}`, { replace: true });
        } else {
          navigate(ROUTES.DASHBOARD, { replace: true });
        }
        break;

      case 'needs_company':
        navigate(ROUTES.ONBOARDING_CREATE_COMPANY, { replace: true });
        break;

      case 'profile_suspended':
        navigate(ROUTES.ACCESS_SUSPENDED, { replace: true });
        break;

      case 'membership_expired':
        navigate(ROUTES.SUBSCRIPTION_REQUIRED, { replace: true });
        break;

      case 'ready':
      default:
        navigate(ROUTES.DASHBOARD, { replace: true });
        break;
    }
  }, [isLoading, isSignedIn, onboardingState, invitationToken, navigate]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Verifying your account...</h3>
        <p className="text-sm text-muted-foreground">Setting up your PeakHR workspace session</p>
      </div>
    </div>
  );
}
