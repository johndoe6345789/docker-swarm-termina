import React from 'react';
import { Box } from '@mui/material';
import '@xterm/xterm/css/xterm.css';
import { InteractiveTerminalProps } from '@/lib/interfaces/terminal';

export default function InteractiveTerminal({ terminalRef }: InteractiveTerminalProps) {
  return (
    <Box
      ref={terminalRef}
      sx={{
        height: { xs: '400px', sm: '500px' },
        backgroundColor: '#300A24',
        borderRadius: '4px',
        border: '1px solid #5E2750',
        overflow: 'hidden',
        '& .xterm': {
          padding: '8px',
        },
        '& .xterm-viewport': {
          backgroundColor: '#300A24 !important',
        },
      }}
    />
  );
}
