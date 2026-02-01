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
        backgroundColor: '#2E3436',
        borderRadius: '4px',
        border: '1px solid #1C1F20',
        overflow: 'hidden',
        '& .xterm': {
          padding: '10px',
        },
        '& .xterm-viewport': {
          backgroundColor: '#2E3436 !important',
        },
        '& .xterm-screen': {
          backgroundColor: '#2E3436',
        },
      }}
    />
  );
}
