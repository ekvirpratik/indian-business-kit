import { useState } from 'react';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useSupabase } from '@/lib/supabase';
import { fetchJwtClaims, fetchMyProfile } from '@/features/auth/services/auth.service';
import type { JwtClaims, UserProfile } from '@/types/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { toast } from '@/lib/toast';

interface VerificationCheck {
  title: string;
  actual: string | null;
  expected: string;
  passed: boolean;
  notes?: string;
}

interface InspectionResult {
  claims: JwtClaims;
  profileResult: UserProfile | null;
  checks: VerificationCheck[];
  allPassed: boolean;
}

export function JwtClaimsInspector() {
  const { clerkUser, isSignedIn, refetchProfile } = useCurrentUser();
  const supabase = useSupabase();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<InspectionResult | null>(null);

  const clerkEmail =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress ??
    null;

  const runInspection = async () => {
    if (!isSignedIn || !clerkUser) {
      toast.error('You must be signed in with Clerk to inspect live JWT claims.');
      return;
    }

    setIsRunning(true);
    try {
      const liveClaims = await fetchJwtClaims(supabase);
      const liveProfile = await fetchMyProfile(supabase, clerkUser.id);
      refetchProfile();

      const currentTimestamp = Date.now();
      const isExpValid = Boolean(liveClaims.claimExp && liveClaims.claimExp * 1000 > currentTimestamp);
      const formattedExp = liveClaims.claimExp
        ? new Date(liveClaims.claimExp * 1000).toLocaleTimeString()
        : null;

      const checks: VerificationCheck[] = [
        {
          title: 'Subject (sub)',
          actual: liveClaims.claimSub,
          expected: clerkUser.id,
          passed: Boolean(liveClaims.claimSub && liveClaims.claimSub === clerkUser.id),
        },
        {
          title: 'Email (email)',
          actual: liveClaims.claimEmail,
          expected: clerkEmail || '(clerk_email)',
          passed: Boolean(
            liveClaims.claimEmail &&
              clerkEmail &&
              liveClaims.claimEmail.toLowerCase() === clerkEmail.toLowerCase()
          ),
          notes: 'Required for trusted invitation validation and company admin binding.',
        },
        {
          title: 'Role (role)',
          actual: liveClaims.claimRole,
          expected: 'authenticated',
          passed: liveClaims.claimRole === 'authenticated',
        },
        {
          title: 'Issuer (iss)',
          actual: liveClaims.claimIss,
          expected: 'Valid Clerk Issuer URL',
          passed: Boolean(liveClaims.claimIss && liveClaims.claimIss.length > 5),
        },
        {
          title: 'Expiry (exp)',
          actual: formattedExp,
          expected: 'Future Timestamp',
          passed: isExpValid,
        },
      ];

      const allPassed = checks.every((c) => c.passed);

      setResult({
        claims: liveClaims,
        profileResult: liveProfile,
        checks,
        allPassed,
      });

      toast.success('Live JWT claims & RLS verification completed.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown verification error';
      toast.error(`Inspection failed: ${message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">Clerk ↔ Supabase Live JWT Claims Inspector</CardTitle>
            {result && (
              <Badge variant={result.allPassed ? 'default' : 'destructive'} className="ml-2">
                {result.allPassed ? 'ALL VERIFICATIONS PASSED' : 'VERIFICATION FAILED'}
              </Badge>
            )}
          </div>
          <CardDescription>
            Calls PostgreSQL RPC <code className="font-mono text-xs">public.inspect_clerk_jwt_claims()</code> with your live Clerk session token to verify RLS compatibility.
          </CardDescription>
        </div>
        <Button onClick={runInspection} disabled={isRunning || !isSignedIn} size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Inspecting...' : 'Inspect Live JWT'}
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {!isSignedIn ? (
          <div className="p-4 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 flex items-center gap-3 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>You must be signed in with a Clerk session to inspect JWT claims in the browser.</span>
          </div>
        ) : !result ? (
          <p className="text-sm text-muted-foreground py-2">
            Click <strong>Inspect Live JWT</strong> above to execute the verification against your current session ({clerkEmail}).
          </p>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Claim</TableHead>
                    <TableHead>Expected Value</TableHead>
                    <TableHead>Actual Value (Postgres)</TableHead>
                    <TableHead className="w-[100px] text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.checks.map((check) => (
                    <TableRow key={check.title}>
                      <TableCell className="font-medium text-xs">{check.title}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{check.expected}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold">{check.actual ?? 'null'}</TableCell>
                      <TableCell className="text-right">
                        {check.passed ? (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 gap-1 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <XCircle className="w-3.5 h-3.5" /> FAIL
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Profile & RLS Lookup Verification */}
            <div className="rounded-lg bg-muted/40 p-4 border space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                PostgreSQL RLS Profile Query Verification
              </h4>
              <div className="flex items-center justify-between text-sm">
                <span>Direct query to <code className="font-mono text-xs">public.profiles</code> via RLS:</span>
                {result.profileResult ? (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Profile Found ({result.profileResult.role})
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    No Profile Yet (First-time Purchaser / Onboarding State)
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
