import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldAlert, ExternalLink, ArrowLeft } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

export default function SubscriptionRequiredPage() {
  const { clerkUser } = useCurrentUser();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="space-y-2">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-2">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <CardTitle className="text-2xl font-bold">Indian Business Kit Membership Required</CardTitle>
          <CardDescription>
            Access to PeakHR requires an active Indian Business Kit platform subscription.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Your current account <span className="font-medium text-foreground">({clerkUser?.primaryEmailAddress?.emailAddress})</span> does not have an active membership, or your subscription has expired.
          </p>
          <div className="rounded-lg bg-muted/50 p-3.5 text-xs text-left space-y-1.5">
            <p className="font-semibold text-foreground">What can you do?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Upgrade or renew your membership on the main platform.</li>
              <li>If you were invited as an employee, ask your company admin to verify your invitation status.</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2.5">
          <Button asChild className="w-full">
            <a href="https://indianbusinesskit.com/pricing" target="_blank" rel="noopener noreferrer">
              Get / Renew Membership <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to={ROUTES.LOGIN}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Return to Sign In
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
