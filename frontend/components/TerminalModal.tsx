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
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Alert,
  Snackbar,
} from '@mui/material';
import { Close, Send, Terminal as TerminalIcon, Code, Warning } from '@mui/icons-material';
import { apiClient, API_BASE_URL } from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

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

  // Mode selection: 'simple' or 'interactive'
  const [mode, setMode] = useState<'simple' | 'interactive'>('interactive');

  // Fallback tracking
  const [interactiveFailed, setInteractiveFailed] = useState(false);
  const [fallbackReason, setFallbackReason] = useState('');
  const [showFallbackNotification, setShowFallbackNotification] = useState(false);

  // Simple mode state
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [workdir, setWorkdir] = useState('/');
  const outputRef = useRef<HTMLDivElement>(null);

  // Interactive mode state
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const connectionAttempts = useRef(0);

  // Auto-scroll to bottom when output changes (simple mode)
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Function to fallback to simple mode
  const fallbackToSimpleMode = (reason: string) => {
    console.warn('Falling back to simple mode:', reason);
    setInteractiveFailed(true);
    setFallbackReason(reason);
    setMode('simple');
    setShowFallbackNotification(true);

    // Cleanup interactive terminal if it exists
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (xtermRef.current) {
      xtermRef.current.dispose();
      xtermRef.current = null;
    }
  };

  // Initialize interactive terminal
  useEffect(() => {
    if (!open || mode !== 'interactive' || !terminalRef.current) return;

    // Create terminal instance
    const term = new Terminal({
      cursorBlink: true,
      fontSize: isMobile ? 12 : 14,
      fontFamily: '"Ubuntu Mono", "Courier New", monospace',
      theme: {
        background: '#300A24',
        foreground: '#F8F8F2',
        cursor: '#F8F8F2',
        black: '#2C0922',
        red: '#FF5555',
        green: '#50FA7B',
        yellow: '#F1FA8C',
        blue: '#8BE9FD',
        magenta: '#FF79C6',
        cyan: '#8BE9FD',
        white: '#F8F8F2',
        brightBlack: '#6272A4',
        brightRed: '#FF6E6E',
        brightGreen: '#69FF94',
        brightYellow: '#FFFFA5',
        brightBlue: '#D6ACFF',
        brightMagenta: '#FF92DF',
        brightCyan: '#A4FFFF',
        brightWhite: '#FFFFFF',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    // Fit terminal to container
    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        console.error('Error fitting terminal:', e);
      }
    }, 0);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Connect to WebSocket
    const wsUrl = API_BASE_URL.replace(/^http/, 'ws');
    const socket = io(`${wsUrl}/terminal`, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      connectionAttempts.current = 0; // Reset on successful connection

      // Start terminal session
      const token = apiClient.getToken();
      const termSize = fitAddon.proposeDimensions();
      socket.emit('start_terminal', {
        container_id: containerId,
        token: token,
        cols: termSize?.cols || 80,
        rows: termSize?.rows || 24,
      });
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      connectionAttempts.current++;

      // After 2 failed attempts, fallback to simple mode
      if (connectionAttempts.current >= 2) {
        fallbackToSimpleMode('Failed to establish WebSocket connection. Network or server may be unavailable.');
      }
    });

    socket.on('started', () => {
      term.write('\r\n*** Interactive Terminal Started ***\r\n');
      term.write('You can now use sudo, nano, vim, and other interactive commands.\r\n\r\n');
    });

    socket.on('output', (data: { data: string }) => {
      term.write(data.data);
    });

    socket.on('error', (data: { error: string }) => {
      console.error('Terminal error:', data.error);
      term.write(`\r\n\x1b[31mError: ${data.error}\x1b[0m\r\n`);

      // Check for critical errors that should trigger fallback
      const criticalErrors = ['Unauthorized', 'Cannot connect to Docker', 'Invalid session'];
      if (criticalErrors.some(err => data.error.includes(err))) {
        setTimeout(() => {
          fallbackToSimpleMode(`Interactive terminal failed: ${data.error}`);
        }, 2000); // Give user time to see the error
      }
    });

    socket.on('exit', () => {
      term.write('\r\n\r\n*** Terminal Session Ended ***\r\n');
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);

      // If disconnect was unexpected and not user-initiated
      if (reason === 'transport error' || reason === 'transport close') {
        fallbackToSimpleMode('WebSocket connection lost unexpectedly.');
      }
    });

    // Handle terminal input
    term.onData((data) => {
      socket.emit('input', { data });
    });

    // Handle terminal resize
    const handleResize = () => {
      try {
        fitAddon.fit();
        const termSize = fitAddon.proposeDimensions();
        if (termSize) {
          socket.emit('resize', {
            cols: termSize.cols,
            rows: termSize.rows,
          });
        }
      } catch (e) {
        console.error('Error resizing terminal:', e);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      socket.disconnect();
      xtermRef.current = null;
      socketRef.current = null;
      fitAddonRef.current = null;
    };
  }, [open, mode, containerId, isMobile]);

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
      } else if (command.trim().startsWith('ls')) {
        // If ls command returns empty output, indicate empty directory
        setOutput((prev) => [...prev, {
          type: 'output',
          content: '(empty directory)'
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
    // Cleanup interactive terminal
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    if (xtermRef.current) {
      xtermRef.current.dispose();
    }

    // Reset simple mode state
    setOutput([]);
    setCommand('');
    setWorkdir('/');

    onClose();
  };

  const handleModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'simple' | 'interactive' | null,
  ) => {
    if (newMode !== null) {
      // If switching to interactive mode after a failure, reset the failure state
      if (newMode === 'interactive' && interactiveFailed) {
        setInteractiveFailed(false);
        setFallbackReason('');
        connectionAttempts.current = 0;
      }
      setMode(newMode);
    }
  };

  const handleRetryInteractive = () => {
    setInteractiveFailed(false);
    setFallbackReason('');
    setShowFallbackNotification(false);
    connectionAttempts.current = 0;
    setMode('interactive');
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
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
          <Typography
            variant="h2"
            component="div"
            sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}
          >
            Terminal - {containerName}
          </Typography>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={handleModeChange}
            size="small"
            sx={{ display: 'flex' }}
          >
            <Tooltip title={interactiveFailed ? "Interactive mode failed - click to retry" : "Interactive mode with full terminal support (sudo, nano, vim)"}>
              <ToggleButton
                value="interactive"
                sx={{
                  flex: 1,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  ...(interactiveFailed && {
                    borderColor: '#f59e0b',
                    color: '#f59e0b',
                    '&:hover': {
                      borderColor: '#d97706',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    },
                  }),
                }}
              >
                {interactiveFailed ? (
                  <Warning sx={{ mr: 0.5, fontSize: '1rem' }} />
                ) : (
                  <TerminalIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                )}
                Interactive
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Simple command execution mode">
              <ToggleButton value="simple" sx={{ flex: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                <Code sx={{ mr: 0.5, fontSize: '1rem' }} />
                Simple
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {mode === 'interactive' ? (
          /* Interactive terminal with xterm.js */
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
        ) : (
          /* Simple command execution mode */
          <>
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
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>

      {/* Fallback notification */}
      <Snackbar
        open={showFallbackNotification}
        autoHideDuration={10000}
        onClose={() => setShowFallbackNotification(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="warning"
          icon={<Warning />}
          action={
            <Button color="inherit" size="small" onClick={handleRetryInteractive}>
              Retry
            </Button>
          }
          onClose={() => setShowFallbackNotification(false)}
          sx={{ width: '100%', maxWidth: '600px' }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Switched to Simple Mode
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            {fallbackReason}
          </Typography>
        </Alert>
      </Snackbar>
    </Dialog>
  );
}
