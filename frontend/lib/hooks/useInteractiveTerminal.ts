import { useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiClient, API_BASE_URL } from '@/lib/api';
import type { Terminal } from '@xterm/xterm';
import type { FitAddon } from '@xterm/addon-fit';

// Type declaration for debug property
declare global {
  interface Window {
    _debugTerminal?: Terminal;
  }
}

interface UseInteractiveTerminalProps {
  open: boolean;
  containerId: string;
  containerName: string;
  isMobile: boolean;
  onFallback: (reason: string) => void;
}

export function useInteractiveTerminal({
  open,
  containerId,
  // containerName is not used but required in the interface for consistency
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  containerName,
  isMobile,
  onFallback,
}: UseInteractiveTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const connectionAttempts = useRef(0);

  useEffect(() => {
    if (!open) return;

    let term: Terminal | null = null;
    let fitAddon: FitAddon | null = null;
    let socket: Socket | null = null;
    let mounted = true;

    const initTerminal = async () => {
      try {
        // Wait for ref to be available
        let attempts = 0;
        while (!terminalRef.current && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (!terminalRef.current || !mounted) {
          console.warn('Terminal ref not available after waiting');
          return;
        }

        console.log('Initializing interactive terminal...');

        const [{ Terminal }, { FitAddon }] = await Promise.all([
          import('@xterm/xterm'),
          import('@xterm/addon-fit'),
        ]);

        if (!terminalRef.current || !mounted) return;

        console.log('Creating terminal instance...');
        term = new Terminal({
          cursorBlink: true,
          fontSize: isMobile ? 12 : 14,
          fontFamily: '"Ubuntu Mono", "DejaVu Sans Mono", "Courier New", monospace',
          theme: {
            // GNOME Terminal color scheme
            background: '#2E3436',
            foreground: '#D3D7CF',
            cursor: '#D3D7CF',
            cursorAccent: '#2E3436',
            selectionBackground: '#4A90D9',
            selectionForeground: '#FFFFFF',
            // Standard colors
            black: '#2E3436',
            red: '#CC0000',
            green: '#4E9A06',
            yellow: '#C4A000',
            blue: '#3465A4',
            magenta: '#75507B',
            cyan: '#06989A',
            white: '#D3D7CF',
            // Bright colors
            brightBlack: '#555753',
            brightRed: '#EF2929',
            brightGreen: '#8AE234',
            brightYellow: '#FCE94F',
            brightBlue: '#729FCF',
            brightMagenta: '#AD7FA8',
            brightCyan: '#34E2E2',
            brightWhite: '#EEEEEC',
          },
        });

        console.log('Loading fit addon...');
        fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        console.log('Opening terminal in DOM...');
        term.open(terminalRef.current);
        console.log('Terminal opened successfully');

        setTimeout(() => {
          try {
            if (fitAddon) fitAddon.fit();
          } catch (e) {
            console.error('Error fitting terminal:', e);
          }
        }, 0);

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Expose terminal for debugging
        if (typeof window !== 'undefined') {
          window._debugTerminal = term;
        }

        // Use polling only - WebSocket is blocked by Cloudflare/reverse proxy
        // This prevents "Invalid frame header" errors during upgrade attempts
        socket = io(`${API_BASE_URL}/terminal`, {
          transports: ['polling'],
          reconnectionDelayMax: 10000,
          timeout: 60000,
          forceNew: true,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('WebSocket connected');
          connectionAttempts.current = 0;

          const token = apiClient.getToken();
          const termSize = fitAddon?.proposeDimensions();
          socket?.emit('start_terminal', {
            container_id: containerId,
            token: token,
            cols: termSize?.cols || 80,
            rows: termSize?.rows || 24,
          });
        });

        socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          connectionAttempts.current++;

          if (connectionAttempts.current >= 2) {
            onFallback('Failed to establish WebSocket connection. Network or server may be unavailable.');
          }
        });

        socket.on('started', () => {
          term?.write('\r\n*** Interactive Terminal Started ***\r\n');
          term?.write('You can now use sudo, nano, vim, and other interactive commands.\r\n\r\n');
        });

        socket.on('output', (data: { data: string }) => {
          console.log('Received output event:', data);
          if (term && data && data.data) {
            term.write(data.data);
          }
        });

        socket.on('error', (data: { error: string }) => {
          console.error('Terminal error:', data.error);
          term?.write(`\r\n\x1b[31mError: ${data.error}\x1b[0m\r\n`);

          const criticalErrors = ['Unauthorized', 'Cannot connect to Docker', 'Invalid session'];
          if (criticalErrors.some(err => data.error.includes(err))) {
            setTimeout(() => {
              onFallback(`Interactive terminal failed: ${data.error}`);
            }, 2000);
          }
        });

        socket.on('exit', () => {
          term?.write('\r\n\r\n*** Terminal Session Ended ***\r\n');
        });

        socket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);

          if (reason === 'transport error' || reason === 'transport close') {
            onFallback('WebSocket connection lost unexpectedly.');
          }
        });

        term.onData((data) => {
          socket?.emit('input', { data });
        });

        const handleResize = () => {
          try {
            if (fitAddon) {
              fitAddon.fit();
              const termSize = fitAddon.proposeDimensions();
              if (termSize) {
                socket?.emit('resize', {
                  cols: termSize.cols,
                  rows: termSize.rows,
                });
              }
            }
          } catch (e) {
            console.error('Error resizing terminal:', e);
          }
        };

        window.addEventListener('resize', handleResize);

        return () => {
          mounted = false;
          window.removeEventListener('resize', handleResize);
          if (term) {
            console.log('Disposing terminal...');
            term.dispose();
          }
          if (socket) {
            console.log('Disconnecting socket...');
            socket.disconnect();
          }
        };
      } catch (error) {
        console.error('Failed to initialize terminal:', error);
        if (mounted) {
          onFallback('Failed to load terminal. Switching to simple mode.');
        }
      }
    };

    const cleanup = initTerminal();

    return () => {
      mounted = false;
      cleanup.then((cleanupFn) => {
        if (cleanupFn) cleanupFn();
      });
      xtermRef.current = null;
      socketRef.current = null;
      fitAddonRef.current = null;
    };
  }, [open, containerId, isMobile, onFallback]);

  const cleanup = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    if (xtermRef.current) {
      xtermRef.current.dispose();
    }
  };

  return {
    terminalRef,
    cleanup,
  };
}
