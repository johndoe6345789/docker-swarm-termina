import { useState, useEffect } from 'react';
import { apiClient, Container } from '@/lib/api';

export function useContainerList(isAuthenticated: boolean) {
  const [containers, setContainers] = useState<Container[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchContainers = async () => {
    setIsRefreshing(true);
    setError('');
    try {
      const data = await apiClient.getContainers();
      setContainers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch containers');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchContainers();
      const interval = setInterval(fetchContainers, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  return {
    containers,
    isRefreshing,
    isLoading,
    error,
    refreshContainers: fetchContainers,
  };
}
