import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/lib/supabase';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useInvitationToken } from '@/features/auth/hooks/useInvitationToken';
import { validateInvitation, acceptInvitation } from '../services/auth.service';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from '@/lib/toast';
import { Building2, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function InvitationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const { token, clearInviteToken } = useInvitationToken();
  const { isSignedIn, clerkUser, refetchProfile } = useCurrentUser();
  const [isAccepting, setIsAccepting] = useState(false);

  const { data: invite, isLoading, isError } = useQuery({
    queryKey: ['invitation-validation', token],
    queryFn: () => validateInvitation(supabase, token!),
    enabled: Boolean(token),
    staleTime: 60 * 1000,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('No invitation token available');
      return acceptInvitation(supabase, token, clerkUser?.fullName || undefined);
    },
    onSuccess: async () => {
      toast.success('Invitation accepted successfully! Welcome to your team.');
      clearInviteToken();
      await queryClient.invalidateQueries({ queryKey: ['current-user-profile'] });
      refetchProfile();
      navigate(ROUTES.DASHBOARD, { replace: true });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to accept invitation. Please verify your email matches.');
      setIsAccepting(false);
    },
  });

  const handleAccept = () => {
    setIsAccepting(true);
    acceptMutation.mutate();
  };

  if (!token) {
    return (
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="w-6 h-6" />
          </div>
          <CardTitle>Missing Invitation Token</CardTitle>
          <CardDescription>No invitation token was provided in the link.</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild variant="outline">
            <Link to={ROUTES.LOGIN}>Return to Sign In</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="max-w-md mx-auto text-center py-12">
        <CardContent className="space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Validating your invitation...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError || !invite?.isValid) {
    return (
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="w-6 h-6" />
          </div>
          <CardTitle>Invalid or Expired Invitation</CardTitle>
          <CardDescription>
            This invitation link is invalid, expired, or has already been accepted.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild variant="outline">
            <Link to={ROUTES.LOGIN}>Return to Sign In</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto shadow-md">
      <CardHeader className="text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
          <Building2 className="w-6 h-6" />
        </div>
        <CardTitle className="text-xl">Team Invitation</CardTitle>
        <CardDescription>
          You have been invited to join <span className="font-semibold text-foreground">{invite.companyName}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role:</span>
            <span className="font-medium capitalize">{invite.role?.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Invited Email:</span>
            <span className="font-mono text-xs">{invite.maskedEmail}</span>
          </div>
        </div>

        {isSignedIn ? (
          <div className="text-sm text-center text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{clerkUser?.primaryEmailAddress?.emailAddress}</span>
          </div>
        ) : (
          <p className="text-xs text-center text-muted-foreground">
            Please sign in or create an account with your invited email to complete joining.
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        {isSignedIn ? (
          <Button onClick={handleAccept} disabled={isAccepting} className="w-full">
            {isAccepting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Accept Invitation & Join Team
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link to={ROUTES.LOGIN}>
              Sign In to Accept <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
