'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { Terminal, PlayArrow, Stop, Refresh, Delete, Inventory2 } from '@mui/icons-material';
import { Container, apiClient } from '@/lib/api';

interface ContainerCardProps {
  container: Container;
  onOpenShell: () => void;
  onContainerUpdate?: () => void;
}

export default function ContainerCard({ container, onOpenShell, onContainerUpdate }: ContainerCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const statusColors = {
    running: 'success',
    stopped: 'default',
    paused: 'warning',
    exited: 'default',
    created: 'info',
  } as const;

  const borderColors = {
    running: '#38b2ac',
    stopped: '#718096',
    paused: '#ecc94b',
    exited: '#718096',
    created: '#4299e1',
  };

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await apiClient.startContainer(container.id);
      setSnackbar({ open: true, message: 'Container started successfully', severity: 'success' });
      onContainerUpdate?.();
    } catch (error) {
      setSnackbar({ open: true, message: `Failed to start: ${error instanceof Error ? error.message : 'Unknown error'}`, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      await apiClient.stopContainer(container.id);
      setSnackbar({ open: true, message: 'Container stopped successfully', severity: 'success' });
      onContainerUpdate?.();
    } catch (error) {
      setSnackbar({ open: true, message: `Failed to stop: ${error instanceof Error ? error.message : 'Unknown error'}`, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = async () => {
    setIsLoading(true);
    try {
      await apiClient.restartContainer(container.id);
      setSnackbar({ open: true, message: 'Container restarted successfully', severity: 'success' });
      onContainerUpdate?.();
    } catch (error) {
      setSnackbar({ open: true, message: `Failed to restart: ${error instanceof Error ? error.message : 'Unknown error'}`, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setShowDeleteDialog(false);
    setIsLoading(true);
    try {
      await apiClient.removeContainer(container.id);
      setSnackbar({ open: true, message: 'Container removed successfully', severity: 'success' });
      onContainerUpdate?.();
    } catch (error) {
      setSnackbar({ open: true, message: `Failed to remove: ${error instanceof Error ? error.message : 'Unknown error'}`, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Card
      sx={{
        borderLeft: 4,
        borderColor: borderColors[container.status as keyof typeof borderColors] || borderColors.stopped,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flex: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                background: 'rgba(56, 178, 172, 0.1)',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Inventory2 sx={{ color: 'secondary.main', fontSize: 20 }} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="h3"
                component="h3"
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {container.name}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {container.image}
              </Typography>
            </Box>
          </Box>

          <Chip
            label={container.status}
            color={statusColors[container.status as keyof typeof statusColors] || 'default'}
            size="small"
            icon={container.status === 'running' ? <PlayArrow sx={{ fontSize: 12 }} /> : undefined}
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              textTransform: 'capitalize',
            }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                mb: 0.5,
              }}
            >
              Container ID
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              {container.id}
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                mb: 0.5,
              }}
            >
              Uptime
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              {container.uptime}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Action buttons based on status */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {(container.status === 'stopped' || container.status === 'exited' || container.status === 'created') && (
              <Button
                variant="contained"
                size="small"
                onClick={handleStart}
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

            {container.status === 'running' && (
              <>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleStop}
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
                  onClick={handleRestart}
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
              onClick={() => setShowDeleteDialog(true)}
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

          {/* Terminal button */}
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={onOpenShell}
            disabled={container.status !== 'running' || isLoading}
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
      </CardContent>

      {/* Delete confirmation dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>Confirm Container Removal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove container <strong>{container.name}</strong>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleRemove} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
}
