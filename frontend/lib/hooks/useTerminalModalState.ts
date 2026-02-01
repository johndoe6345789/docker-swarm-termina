import { useState } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

/**
 * Comprehensive hook for managing TerminalModal state
 * Handles mode switching, fallback logic, and UI state
 */
export function useTerminalModalState() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [mode, setMode] = useState<'simple' | 'interactive'>('interactive');
  const [interactiveFailed, setInteractiveFailed] = useState(false);
  const [fallbackReason, setFallbackReason] = useState('');
  const [showFallbackNotification, setShowFallbackNotification] = useState(false);

  const handleFallback = (reason: string) => {
    console.warn('Falling back to simple mode:', reason);
    setInteractiveFailed(true);
    setFallbackReason(reason);
    setMode('simple');
    setShowFallbackNotification(false);
  };

  const handleModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'simple' | 'interactive' | null,
  ) => {
    if (newMode !== null) {
      if (newMode === 'interactive' && interactiveFailed) {
        setInteractiveFailed(false);
        setFallbackReason('');
      }
      setMode(newMode);
    }
  };

  const handleRetryInteractive = () => {
    setInteractiveFailed(false);
    setFallbackReason('');
    setShowFallbackNotification(false);
    setMode('interactive');
  };

  const reset = () => {
    setMode('interactive');
    setInteractiveFailed(false);
    setFallbackReason('');
    setShowFallbackNotification(false);
  };

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
