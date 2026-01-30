'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close, Send } from '@mui/icons-material';
import { apiClient } from '@/lib/api';

interface TerminalModalProps {
  open: boolean;
  onClose: () => void;
  containerName: string;
  containerId: string;
}

interface OutputLine {
  type: 'command' | 'output' | 'error';
  content: string;
  workdir?: string;
}

export default function TerminalModal({
  open,
  onClose,
  containerName,
  containerId,
}: TerminalModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [workdir, setWorkdir] = useState('/');
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleExecute = async () => {
    if (!command.trim()) return;

    setIsExecuting(true);

    // Add command to output with current working directory
    setOutput((prev) => [...prev, {
      type: 'command',
      content: command,
      workdir: workdir
    }]);

    try {
      const result = await apiClient.executeCommand(containerId, command);

      // Update working directory if provided
      if (result.workdir) {
        setWorkdir(result.workdir);
      }

      // Add command output
      if (result.output && result.output.trim()) {
        setOutput((prev) => [...prev, {
          type: result.exit_code === 0 ? 'output' : 'error',
          content: result.output
        }]);
      }
    } catch (error) {
      setOutput((prev) => [...prev, {
        type: 'error',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]);
    } finally {
      setIsExecuting(false);
      setCommand('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecute();
    }
  };

  const handleClose = () => {
    setOutput([]);
    setCommand('');
    setWorkdir('/');
    onClose();
  };

  const formatPrompt = (workdir: string) => {
    // Shorten workdir if it's too long (show ~ for home, or just basename)
    let displayDir = workdir;
    if (workdir.length > 30) {
      const parts = workdir.split('/');
      displayDir = '.../' + parts[parts.length - 1];
    }
    return `root@${containerName}:${displayDir}#`;
  };

  const highlightCommand = (line: OutputLine) => {
    if (line.type === 'command') {
      const prompt = formatPrompt(line.workdir || '/');
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
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          pt: { xs: 1, sm: 2 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Typography
          variant="h2"
          component="div"
          sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}
        >
          Terminal - {containerName}
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
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
                  {highlightCommand(line)}
                </React.Fragment>
              ))}
            </Box>
          )}
        </Paper>

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
            {formatPrompt(workdir)}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
            <TextField
              fullWidth
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyPress={handleKeyPress}
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
                onClick={handleExecute}
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
                onClick={handleExecute}
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
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
