import React from 'react';
import { Snackbar, Alert, Typography, Button } from '@mui/material';
import { Warning } from '@mui/icons-material';
import { FallbackNotificationProps } from '@/lib/interfaces/terminal';

export default function FallbackNotification({
  show,
  reason,
  onClose,
  onRetry,
}: FallbackNotificationProps) {
  return (
    <Snackbar
      open={show}
      autoHideDuration={10000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        severity="warning"
        icon={<Warning />}
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        }
        onClose={onClose}
        sx={{ width: '100%', maxWidth: '600px' }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Switched to Simple Mode
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          {reason}
        </Typography>
      </Alert>
    </Snackbar>
  );
}
