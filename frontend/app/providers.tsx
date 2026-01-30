'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/store/store';
import { initAuth, setUnauthenticated } from '@/lib/store/authSlice';
import { setAuthErrorCallback } from '@/lib/store/authErrorHandler';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Set up global auth error handler
   setAuthErrorCallback(() => {
      // Clear auth state and redirect to login
      store.dispatch(setUnauthenticated());
      router.push('/');
    });

    // Initialize auth state
    store.dispatch(initAuth());
  }, [router]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
