'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogActions, Button, useMediaQuery, useTheme } from '@mui/material';
import { useSimpleTerminal } from '@/lib/hooks/useSimpleTerminal';
import { useInteractiveTerminal } from '@/lib/hooks/useInteractiveTerminal';
import { TerminalModalProps } from '@/lib/interfaces/terminal';
import TerminalHeader from './TerminalModal/TerminalHeader';
import SimpleTerminal from './TerminalModal/SimpleTerminal';
import InteractiveTerminal from './TerminalModal/InteractiveTerminal';
import FallbackNotification from './TerminalModal/FallbackNotification';

export default function TerminalModal({
  open,
  onClose,
  containerName,
  containerId,
}: TerminalModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [mode, setMode] = useState<'simple' | 'interactive'>('interactive');
  const [interactiveFailed, setInteractiveFailed] = useState(false);
  const [fallbackReason, setFallbackReason] = useState('');
  const [showFallbackNotification, setShowFallbackNotification] = useState(false);

  const simpleTerminal = useSimpleTerminal(containerId);

  const handleFallback = (reason: string) => {
    console.warn('Falling back to simple mode:', reason);
    setInteractiveFailed(true);
    setFallbackReason(reason);
    setMode('simple');
    setShowFallbackNotification(true);
    interactiveTerminal.cleanup();
  };

  const interactiveTerminal = useInteractiveTerminal({
    open: open && mode === 'interactive',
    containerId,
    containerName,
    isMobile,
    onFallback: handleFallback,
  });

  const handleClose = () => {
    interactiveTerminal.cleanup();
    simpleTerminal.reset();
    onClose();
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      simpleTerminal.executeCommand();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          minHeight: isMobile ? '100vh' : '500px',
          maxHeight: isMobile ? '100vh' : '80vh',
        },
      }}
    >
      <TerminalHeader
        containerName={containerName}
        mode={mode}
        interactiveFailed={interactiveFailed}
        onModeChange={handleModeChange}
        onClose={handleClose}
      />

      <DialogContent dividers>
        {mode === 'interactive' ? (
          <InteractiveTerminal terminalRef={interactiveTerminal.terminalRef} />
        ) : (
          <SimpleTerminal
            output={simpleTerminal.output}
            command={simpleTerminal.command}
            workdir={simpleTerminal.workdir}
            isExecuting={simpleTerminal.isExecuting}
            isMobile={isMobile}
            containerName={containerName}
            outputRef={simpleTerminal.outputRef}
            onCommandChange={simpleTerminal.setCommand}
            onExecute={simpleTerminal.executeCommand}
            onKeyPress={handleKeyPress}
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>

      <FallbackNotification
        show={showFallbackNotification}
        reason={fallbackReason}
        onClose={() => setShowFallbackNotification(false)}
        onRetry={handleRetryInteractive}
      />
    </Dialog>
  );
}
