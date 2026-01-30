import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { DeleteConfirmDialogProps } from '@/lib/interfaces/container';

export default function DeleteConfirmDialog({
  open,
  containerName,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirm Container Removal</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to remove container <strong>{containerName}</strong>?
          This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Remove
        </Button>
      </DialogActions>
    </Dialog>
  );
}
