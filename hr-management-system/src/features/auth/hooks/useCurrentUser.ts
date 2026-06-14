export function useCurrentUser() {
  // Mock implementation for MVP
  // Later this will fetch from Supabase profiles
  const user = {
    id: "123",
    role: "company_admin",
    email: "admin@indianbusinesskit.com",
  };

  return {
    user,
    session: "mock-session-id",
    isLoading: false,
    role: user.role,
  };
}
