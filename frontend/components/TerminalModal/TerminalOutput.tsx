import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { OutputLine } from '@/lib/hooks/useSimpleTerminal';

interface TerminalOutputProps {
  output: OutputLine[];
  containerName: string;
  outputRef: React.RefObject<HTMLDivElement | null>;
}

const formatPrompt = (containerName: string, workdir: string) => {
  let displayDir = workdir;
  if (workdir.length > 30) {
    const parts = workdir.split('/');
    displayDir = '.../' + parts[parts.length - 1];
  }
  return `root@${containerName}:${displayDir}#`;
};

const highlightCommand = (line: OutputLine, containerName: string) => {
  if (line.type === 'command') {
    const prompt = formatPrompt(containerName, line.workdir || '/');
    const parts = line.content.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1).join(' ');

    return (
      <div style={{ marginBottom: '4px' }}>
        <span style={{ color: '#8BE9FD', fontWeight: 'bold' }}>{prompt}</span>
        {' '}
        <span style={{ color: '#50FA7B', fontWeight: 'bold' }}>{cmd}</span>
        {args && <span style={{ color: '#F8F8F2' }}> {args}</span>}
      </div>
    );
  } else if (line.type === 'error') {
    return (
      <div style={{ color: '#FF5555', marginBottom: '2px' }}>
        {line.content}
      </div>
    );
  } else {
    return (
      <div style={{ color: '#F8F8F2', marginBottom: '2px', whiteSpace: 'pre-wrap' }}>
        {line.content}
      </div>
    );
  }
};

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
