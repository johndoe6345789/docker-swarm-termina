import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { TerminalOutputProps } from '@/lib/interfaces/terminal';
import { highlightCommand } from '@/lib/utils/terminal';

export default function TerminalOutput({ output, containerName, outputRef }: TerminalOutputProps) {
  return (
    <Paper
      ref={outputRef}
      elevation={0}
      sx={{
        backgroundColor: '#300A24',
        color: '#F8F8F2',
        fontFamily: '"Ubuntu Mono", "Courier New", monospace',
        fontSize: { xs: '12px', sm: '14px' },
        padding: { xs: 1.5, sm: 2 },
        minHeight: { xs: '300px', sm: '400px' },
        maxHeight: { xs: '400px', sm: '500px' },
        overflowY: 'auto',
        mb: 2,
        border: '1px solid #5E2750',
        borderRadius: '4px',
        '&::-webkit-scrollbar': {
          width: { xs: '6px', sm: '10px' },
        },
        '&::-webkit-scrollbar-track': {
          background: '#2C0922',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#5E2750',
          borderRadius: '5px',
          '&:hover': {
            background: '#772953',
          }
        },
      }}
    >
      {output.length === 0 ? (
        <Box>
          <Typography sx={{
            color: '#8BE9FD',
            fontFamily: 'inherit',
            fontSize: '13px',
            mb: 1
          }}>
            Ubuntu-style Terminal - Connected to <span style={{ color: '#50FA7B', fontWeight: 'bold' }}>{containerName}</span>
          </Typography>
          <Typography sx={{
            color: '#6272A4',
            fontFamily: 'inherit',
            fontSize: '12px'
          }}>
            Type a command and press Enter or click Execute...
          </Typography>
        </Box>
      ) : (
        <Box>
          {output.map((line, index) => (
            <React.Fragment key={index}>
              {highlightCommand(line, containerName)}
            </React.Fragment>
          ))}
        </Box>
      )}
    </Paper>
  );
}
