'use client';

import React, { useState } from 'react';
import { Card, CardContent, Divider, Snackbar, Alert } from '@mui/material';
import { Container } from '@/lib/api';
import { ContainerCardProps } from '@/lib/interfaces/container';
import { useContainerActions } from '@/lib/hooks/useContainerActions';
import ContainerHeader from './ContainerCard/ContainerHeader';
import ContainerInfo from './ContainerCard/ContainerInfo';
import ContainerActions from './ContainerCard/ContainerActions';
import DeleteConfirmDialog from './ContainerCard/DeleteConfirmDialog';

const borderColors = {
  running: '#38b2ac',
  stopped: '#718096',
  paused: '#ecc94b',
  exited: '#718096',
  created: '#4299e1',
};

export default function ContainerCard({ container, onOpenShell, onContainerUpdate }: ContainerCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const {
    isLoading,
    snackbar,
    handleStart,
    handleStop,
    handleRestart,
    handleRemove,
    closeSnackbar,
  } = useContainerActions(container.id, onContainerUpdate);

  const confirmRemove = () => {
    setShowDeleteDialog(false);
    handleRemove();
  };

  return (
    <Card
      data-testid="container-card"
      sx={{
        borderLeft: 4,
        borderColor: borderColors[container.status as keyof typeof borderColors] || borderColors.stopped,
      }}
    >
      <CardContent>
        <ContainerHeader
          name={container.name}
          image={container.image}
          status={container.status}
        />

        <Divider sx={{ my: 2 }} />

        <ContainerInfo id={container.id} uptime={container.uptime} />

        <ContainerActions
          status={container.status}
          isLoading={isLoading}
          onStart={handleStart}
          onStop={handleStop}
          onRestart={handleRestart}
          onRemove={() => setShowDeleteDialog(true)}
          onOpenShell={onOpenShell}
        />
      </CardContent>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        containerName={container.name}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmRemove}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
}
