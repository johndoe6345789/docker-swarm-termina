import React from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { PlayArrow, Stop, Refresh, Delete, Terminal } from '@mui/icons-material';

interface ContainerActionsProps {
  status: string;
  isLoading: boolean;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onRemove: () => void;
  onOpenShell: () => void;
}

export default function ContainerActions({
  status,
  isLoading,
  onStart,
  onStop,
  onRestart,
  onRemove,
  onOpenShell,
}: ContainerActionsProps) {
  const isRunning = status === 'running';
  const isStopped = status === 'stopped' || status === 'exited' || status === 'created';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {isStopped && (
          <Button
            variant="contained"
            size="small"
            onClick={onStart}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={16} /> : <PlayArrow />}
            sx={{
              flex: 1,
              minWidth: '100px',
              backgroundColor: '#38b2ac',
              '&:hover': { backgroundColor: '#2c8a84' },
            }}
          >
            Start
          </Button>
        )}

        {isRunning && (
          <>
            <Button
              variant="contained"
              size="small"
              onClick={onStop}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={16} /> : <Stop />}
              sx={{
                flex: 1,
                minWidth: '100px',
                backgroundColor: '#f56565',
                '&:hover': { backgroundColor: '#e53e3e' },
              }}
            >
              Stop
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={onRestart}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={16} /> : <Refresh />}
              sx={{
                flex: 1,
                minWidth: '100px',
                borderColor: '#ecc94b',
                color: '#ecc94b',
                '&:hover': {
                  borderColor: '#d69e2e',
                  backgroundColor: 'rgba(236, 201, 75, 0.1)',
                },
              }}
            >
              Restart
            </Button>
          </>
        )}

        <Button
          variant="outlined"
          size="small"
          onClick={onRemove}
          disabled={isLoading}
          startIcon={<Delete />}
          sx={{
            minWidth: '100px',
            borderColor: '#fc8181',
            color: '#fc8181',
            '&:hover': {
              borderColor: '#f56565',
              backgroundColor: 'rgba(252, 129, 129, 0.1)',
            },
          }}
        >
          Remove
        </Button>
      </Box>

      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={onOpenShell}
        disabled={!isRunning || isLoading}
        startIcon={<Terminal />}
        sx={{
          fontWeight: 500,
          '&:hover': {
            backgroundColor: 'secondary.main',
          },
        }}
      >
        Open Shell
      </Button>
    </Box>
  );
}
