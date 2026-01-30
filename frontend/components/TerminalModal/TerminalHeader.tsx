import React from 'react';
import {
  DialogTitle,
  Box,
  Typography,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
} from '@mui/material';
import { Close, Terminal as TerminalIcon, Code, Warning } from '@mui/icons-material';

interface TerminalHeaderProps {
  containerName: string;
  mode: 'simple' | 'interactive';
  interactiveFailed: boolean;
  onModeChange: (event: React.MouseEvent<HTMLElement>, newMode: 'simple' | 'interactive' | null) => void;
  onClose: () => void;
}

export default function TerminalHeader({
  containerName,
  mode,
  interactiveFailed,
  onModeChange,
  onClose,
}: TerminalHeaderProps) {
  return (
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
          onChange={onModeChange}
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
      <IconButton onClick={onClose} size="small">
        <Close />
      </IconButton>
    </DialogTitle>
  );
}
