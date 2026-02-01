'use client';

import React from 'react';
import { Dialog, DialogContent, DialogActions, Button } from '@mui/material';
import { useSimpleTerminal } from '@/lib/hooks/useSimpleTerminal';
import { useInteractiveTerminal } from '@/lib/hooks/useInteractiveTerminal';
import { useTerminalModalState } from '@/lib/hooks/useTerminalModalState';
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
  const modalState = useTerminalModalState();
  const simpleTerminal = useSimpleTerminal(containerId);

  const interactiveTerminal = useInteractiveTerminal({
    open: open && modalState.mode === 'interactive',
    containerId,
    containerName,
    isMobile: modalState.isMobile,
    onFallback: modalState.handleFallback,
  });

  const handleClose = () => {
    interactiveTerminal.cleanup();
    simpleTerminal.reset();
    modalState.reset();
    onClose();
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
      fullScreen={modalState.isMobile}
      PaperProps={{
        sx: {
          minHeight: modalState.isMobile ? '100vh' : '500px',
          maxHeight: modalState.isMobile ? '100vh' : '80vh',
        },
      }}
    >
      <TerminalHeader
        containerName={containerName}
        mode={modalState.mode}
        interactiveFailed={modalState.interactiveFailed}
        onModeChange={modalState.handleModeChange}
        onClose={handleClose}
      />

      <DialogContent dividers>
        {modalState.mode === 'interactive' ? (
          <InteractiveTerminal terminalRef={interactiveTerminal.terminalRef} />
        ) : (
          <SimpleTerminal
            output={simpleTerminal.output}
            command={simpleTerminal.command}
            workdir={simpleTerminal.workdir}
            isExecuting={simpleTerminal.isExecuting}
            isMobile={modalState.isMobile}
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
        show={modalState.showFallbackNotification}
        reason={modalState.fallbackReason}
        onClose={() => modalState.reset()}
        onRetry={modalState.handleRetryInteractive}
      />
    </Dialog>
  );
}
