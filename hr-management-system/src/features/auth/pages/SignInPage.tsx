import { SignIn } from '@clerk/clerk-react';
import { ROUTES } from '@/constants/routes';

export default function SignInPage() {
  return (
    <div className="flex justify-center items-center py-4">
      <SignIn
        routing="path"
        path={ROUTES.LOGIN}
        signUpUrl={ROUTES.REGISTER}
        fallbackRedirectUrl={ROUTES.POST_AUTH}
        appearance={{
          elements: {
            rootBox: 'w-full',
            card: 'shadow-none p-0 bg-transparent w-full',
            headerTitle: 'text-2xl font-bold text-foreground',
            headerSubtitle: 'text-muted-foreground',
            formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
            footerActionLink: 'text-primary hover:underline',
          },
        }}
      />
    </div>
  );
}
