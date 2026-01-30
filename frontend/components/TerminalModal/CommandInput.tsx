import React from 'react';
import { Box, Typography, TextField, Button, IconButton } from '@mui/material';
import { Send } from '@mui/icons-material';

interface CommandInputProps {
  command: string;
  workdir: string;
  isExecuting: boolean;
  isMobile: boolean;
  containerName: string;
  onCommandChange: (value: string) => void;
  onExecute: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

const formatPrompt = (containerName: string, workdir: string) => {
  let displayDir = workdir;
  if (workdir.length > 30) {
    const parts = workdir.split('/');
    displayDir = '.../' + parts[parts.length - 1];
  }
  return `root@${containerName}:${displayDir}#`;
};

export default function CommandInput({
  command,
  workdir,
  isExecuting,
  isMobile,
  containerName,
  onCommandChange,
  onExecute,
  onKeyPress,
}: CommandInputProps) {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: 1,
      alignItems: isMobile ? 'stretch' : 'center'
    }}>
      <Typography sx={{
        fontFamily: '"Ubuntu Mono", monospace',
        fontSize: { xs: '12px', sm: '14px' },
        color: '#8BE9FD',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        alignSelf: isMobile ? 'flex-start' : 'center'
      }}>
        {formatPrompt(containerName, workdir)}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
        <TextField
          fullWidth
          value={command}
          onChange={(e) => onCommandChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder="ls -la"
          disabled={isExecuting}
          variant="outlined"
          size="small"
          autoFocus
          sx={{
            fontFamily: '"Ubuntu Mono", monospace',
            '& input': {
              fontFamily: '"Ubuntu Mono", monospace',
              fontSize: { xs: '12px', sm: '14px' },
              padding: { xs: '6px 10px', sm: '8px 12px' },
              color: '#F8F8F2',
            },
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#1E1E1E',
              '& fieldset': {
                borderColor: '#5E2750',
              },
              '&:hover fieldset': {
                borderColor: '#772953',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#8BE9FD',
              },
            },
          }}
        />
        {isMobile ? (
          <IconButton
            onClick={onExecute}
            disabled={isExecuting || !command.trim()}
            sx={{
              backgroundColor: '#5E2750',
              color: 'white',
              '&:hover': {
                backgroundColor: '#772953',
              },
              '&:disabled': {
                backgroundColor: '#3a1a2f',
              },
            }}
          >
            <Send />
          </IconButton>
        ) : (
          <Button
            variant="contained"
            onClick={onExecute}
            disabled={isExecuting || !command.trim()}
            startIcon={<Send />}
            sx={{
              backgroundColor: '#5E2750',
              '&:hover': {
                backgroundColor: '#772953',
              },
              textTransform: 'none',
              fontWeight: 'bold',
            }}
          >
            Run
          </Button>
        )}
      </Box>
    </Box>
  );
}
