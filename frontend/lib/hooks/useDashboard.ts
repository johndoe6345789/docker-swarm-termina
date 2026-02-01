import { useRouter } from 'next/navigation';
import { useMediaQuery, useTheme } from '@mui/material';
import { useAppDispatch } from '@/lib/store/hooks';
import { logout as logoutAction } from '@/lib/store/authSlice';
import { useAuthRedirect } from './useAuthRedirect';
import { useContainerList } from './useContainerList';
import { useTerminalModal } from './useTerminalModal';

/**
 * Comprehensive hook for managing Dashboard page state and logic
 * Combines authentication, container management, and terminal modal
 */
export function useDashboard() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { isAuthenticated, loading: authLoading } = useAuthRedirect('/');
  const { containers, isRefreshing, isLoading, error, refreshContainers } = useContainerList(isAuthenticated);
  const { selectedContainer, isTerminalOpen, openTerminal, closeTerminal } = useTerminalModal();

  const handleLogout = async () => {
    await dispatch(logoutAction());
    router.push('/');
  };

  const isInitialLoading = authLoading || isLoading;
  const hasContainers = containers.length > 0;
  const showEmptyState = !isInitialLoading && !hasContainers;

  return {
    // Authentication
    isAuthenticated,
    authLoading,
    handleLogout,

    // Container list
    containers,
    isRefreshing,
    isLoading,
    error,
    refreshContainers,

    // Terminal modal
    selectedContainer,
    isTerminalOpen,
    openTerminal,
    closeTerminal,

    // UI state
    isMobile,
    isInitialLoading,
    hasContainers,
    showEmptyState,
  };
}
