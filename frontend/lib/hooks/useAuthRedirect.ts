import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/store/hooks';

export function useAuthRedirect(redirectTo: '/dashboard' | '/') {
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (redirectTo === '/dashboard' && isAuthenticated) {
      router.push('/dashboard');
    } else if (redirectTo === '/' && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router, redirectTo]);

  return { isAuthenticated, loading };
}
