'use client';

import React, { useEffect, useCallback } from 'react';
import { Provider } from 'react-redux';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/store/store';
import { initAuth, setUnauthenticated } from '@/lib/store/authSlice';
import { setAuthErrorCallback } from '@/lib/store/authErrorHandler';
import { useAppDispatch } from '@/lib/store/hooks';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Memoize the auth error callback to prevent recreating on every render
  const handleAuthError = useCallback(() => {
    // Clear auth state and redirect to login
    dispatch(setUnauthenticated());
    router.push('/');
  }, [dispatch, router]);

  useEffect(() => {
    // Initialize auth state
    dispatch(initAuth());

    // Set up global auth error handler
    setAuthErrorCallback(handleAuthError);
  }, [dispatch, handleAuthError]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
