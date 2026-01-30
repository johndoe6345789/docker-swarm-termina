import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { login, clearError } from '@/lib/store/authSlice';

export function useLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const dispatch = useAppDispatch();
  const { error, loading } = useAppSelector((state) => state.auth);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    const result = await dispatch(login({ username, password }));

    if (login.fulfilled.match(result)) {
      router.push('/dashboard');
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    isShaking,
    error,
    loading,
    handleSubmit,
  };
}
