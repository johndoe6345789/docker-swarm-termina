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
        backgroundColor: '#2E3436',
        color: '#D3D7CF',
        fontFamily: '"Ubuntu Mono", "DejaVu Sans Mono", "Courier New", monospace',
        fontSize: { xs: '12px', sm: '14px' },
        padding: { xs: 1.5, sm: 2 },
        minHeight: { xs: '300px', sm: '400px' },
        maxHeight: { xs: '400px', sm: '500px' },
        overflowY: 'auto',
        mb: 2,
        border: '1px solid #1C1F20',
        borderRadius: '4px',
        '&::-webkit-scrollbar': {
          width: { xs: '6px', sm: '10px' },
        },
        '&::-webkit-scrollbar-track': {
          background: '#1C1F20',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#555753',
          borderRadius: '5px',
          '&:hover': {
            background: '#729FCF',
          }
        },
      }}
    >
      {output.length === 0 ? (
        <Box>
          <Typography sx={{
            color: '#729FCF',
            fontFamily: 'inherit',
            fontSize: '13px',
            mb: 1
          }}>
            Ubuntu-style Terminal - Connected to <span style={{ color: '#8AE234', fontWeight: 'bold' }}>{containerName}</span>
          </Typography>
          <Typography sx={{
            color: '#555753',
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
