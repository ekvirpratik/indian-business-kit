import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { UserX, ArrowLeft, Mail } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

export default function AccessSuspendedPage() {
  const { clerkUser } = useCurrentUser();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="space-y-2">
          <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
            <UserX className="w-7 h-7" />
          </div>
          <CardTitle className="text-2xl font-bold">Account Access Inactive</CardTitle>
          <CardDescription>
            Your PeakHR employee profile is currently set to inactive or suspended.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Your account <span className="font-medium text-foreground">({clerkUser?.primaryEmailAddress?.emailAddress})</span> has been deactivated by your organization administrator.
          </p>
          <div className="rounded-lg bg-muted/50 p-3.5 text-xs text-left">
            <p className="text-muted-foreground">
              Please contact your organization administrator or HR manager to reactivate your workspace access.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2.5">
          <Button asChild variant="outline" className="w-full">
            <a href="mailto:support@indianbusinesskit.com">
              <Mail className="w-4 h-4 mr-2" /> Contact HR Support
            </a>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link to={ROUTES.LOGIN}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Return to Sign In
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
