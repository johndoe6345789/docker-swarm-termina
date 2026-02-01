import { useState, useCallback } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

/**
 * Comprehensive hook for managing TerminalModal state
 * Handles mode switching, fallback logic, and UI state
 *
 * IMPORTANT: All handlers are memoized with useCallback to prevent
 * unnecessary re-renders in dependent hooks (e.g., useInteractiveTerminal)
 * which would cause WebSocket reconnection loops.
 */
export function useTerminalModalState() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [mode, setMode] = useState<'simple' | 'interactive'>('interactive');
  const [interactiveFailed, setInteractiveFailed] = useState(false);
  const [fallbackReason, setFallbackReason] = useState('');
  const [showFallbackNotification, setShowFallbackNotification] = useState(false);

  const handleFallback = useCallback((reason: string) => {
    console.warn('Falling back to simple mode:', reason);
    setInteractiveFailed(true);
    setFallbackReason(reason);
    setMode('simple');
    setShowFallbackNotification(false);
  }, []);

  const handleModeChange = useCallback((
    event: React.MouseEvent<HTMLElement>,
    newMode: 'simple' | 'interactive' | null,
  ) => {
    if (newMode !== null) {
      if (newMode === 'interactive') {
        setInteractiveFailed(false);
        setFallbackReason('');
      }
      setMode(newMode);
    }
  }, []);

  const handleRetryInteractive = useCallback(() => {
    setInteractiveFailed(false);
    setFallbackReason('');
    setShowFallbackNotification(false);
    setMode('interactive');
  }, []);

  const reset = useCallback(() => {
    setMode('interactive');
    setInteractiveFailed(false);
    setFallbackReason('');
    setShowFallbackNotification(false);
  }, []);

  return {
    isMobile,
    mode,
    interactiveFailed,
    fallbackReason,
    showFallbackNotification,
    handleFallback,
    handleModeChange,
    handleRetryInteractive,
    reset,
  };
}
