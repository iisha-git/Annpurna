import { Redirect } from 'expo-router';

import { useAuthSession } from '@/features/auth/presentation/use-auth-session';
import AuthScreen from '@/features/auth/presentation/auth-screen';

/** Route wrapper — signed-in users have no business here. */
export default function LoginRoute() {
  const { user, loading } = useAuthSession();
  if (loading) return null;
  if (user) return <Redirect href="/" />;
  return <AuthScreen />;
}
