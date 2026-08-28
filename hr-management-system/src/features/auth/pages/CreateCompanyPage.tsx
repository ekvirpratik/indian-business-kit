import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/lib/supabase';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { createCompanyAndAdmin } from '../services/auth.service';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from '@/lib/toast';
import { Building2, Loader2, Sparkles } from 'lucide-react';

const createCompanySchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(100, 'Company name is too long'),
  timezone: z.string().min(1, 'Timezone is required'),
});

type CreateCompanyFormValues = z.infer<typeof createCompanySchema>;

export default function CreateCompanyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const { refetchProfile } = useCurrentUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCompanyFormValues>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      companyName: '',
      timezone: 'Asia/Kolkata',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: CreateCompanyFormValues) => {
      return createCompanyAndAdmin(supabase, values.companyName, values.timezone);
    },
    onSuccess: async () => {
      toast.success('Company created successfully! Welcome to your HRMS dashboard.');
      await queryClient.invalidateQueries({ queryKey: ['current-user-profile'] });
      refetchProfile();
      navigate(ROUTES.DASHBOARD, { replace: true });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create company. Please ensure you have an active membership.');
    },
  });

  const onSubmit = (data: CreateCompanyFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1">
            <Building2 className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Set Up Your Organization</CardTitle>
          <CardDescription>
            Welcome to Indian Business Kit PeakHR. Let’s configure your company workspace to get started.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company / Organization Name</Label>
              <Input
                id="companyName"
                placeholder="e.g. Acme Technologies Private Limited"
                {...register('companyName')}
                className={errors.companyName ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {errors.companyName && (
                <p className="text-xs text-destructive">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Operating Timezone</Label>
              <Input
                id="timezone"
                placeholder="Asia/Kolkata"
                {...register('timezone')}
                className={errors.timezone ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">Default: Asia/Kolkata (Indian Standard Time)</p>
              {errors.timezone && (
                <p className="text-xs text-destructive">{errors.timezone.message}</p>
              )}
            </div>

            <div className="rounded-lg bg-primary/5 border border-primary/15 p-3.5 flex items-start gap-2.5 text-xs text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                As the organization creator, you will automatically be assigned the <strong>Company Admin</strong> role with full administrative privileges.
              </span>
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Workspace...
                </>
              ) : (
                'Create Company & Launch Dashboard'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
