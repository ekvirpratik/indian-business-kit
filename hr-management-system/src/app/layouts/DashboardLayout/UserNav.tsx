import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { LogOut, Settings, User } from 'lucide-react';

export function UserNav() {
  const { clerkUser, role } = useCurrentUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const email = clerkUser?.primaryEmailAddress?.emailAddress || 'user@indianbusinesskit.com';
  const name = clerkUser?.fullName || clerkUser?.firstName || email.split('@')[0];
  const initials = name.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-1 ring-border">
          <Avatar className="h-9 w-9">
            <AvatarImage src={clerkUser?.imageUrl || ''} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">{email}</p>
            {role && (
              <span className="inline-block mt-1 text-[10px] font-semibold tracking-wider uppercase text-primary">
                {role.replace('_', ' ')}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(ROUTES.SETTINGS)}>
          <User className="w-4 h-4 mr-2" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(ROUTES.SETTINGS)}>
          <Settings className="w-4 h-4 mr-2" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="w-4 h-4 mr-2" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
