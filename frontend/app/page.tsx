'use client';

import { useAuthRedirect } from '@/lib/hooks/useAuthRedirect';
import LoginForm from '@/components/LoginForm';

export default function Home() {
  const { loading } = useAuthRedirect('/dashboard');

  if (loading) {
    return null;
  }

  return <LoginForm />;
}
