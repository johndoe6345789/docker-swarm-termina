import { useState } from 'react';
import { apiClient } from '@/lib/api';

export function useContainerActions(containerId: string, onUpdate?: () => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSuccess = (message: string) => {
    setSnackbar({ open: true, message, severity: 'success' });
    onUpdate?.();
  };

  const showError = (action: string, error: unknown) => {
    const message = `Failed to ${action}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    setSnackbar({ open: true, message, severity: 'error' });
  };

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await apiClient.startContainer(containerId);
      showSuccess('Container started successfully');
    } catch (error) {
      showError('start', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      await apiClient.stopContainer(containerId);
      showSuccess('Container stopped successfully');
    } catch (error) {
      showError('stop', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = async () => {
    setIsLoading(true);
    try {
      await apiClient.restartContainer(containerId);
      showSuccess('Container restarted successfully');
    } catch (error) {
      showError('restart', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      await apiClient.removeContainer(containerId);
      showSuccess('Container removed successfully');
    } catch (error) {
      showError('remove', error);
    } finally {
      setIsLoading(false);
    }
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return {
    isLoading,
    snackbar,
    handleStart,
    handleStop,
    handleRestart,
    handleRemove,
    closeSnackbar,
  };
}
