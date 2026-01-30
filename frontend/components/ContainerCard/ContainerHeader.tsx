import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { PlayArrow, Inventory2 } from '@mui/icons-material';
import { ContainerHeaderProps } from '@/lib/interfaces/container';

const statusColors = {
  running: 'success',
  stopped: 'default',
  paused: 'warning',
  exited: 'default',
  created: 'info',
} as const;

export default function ContainerHeader({ name, image, status }: ContainerHeaderProps) {
  return (
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
            {name}
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
            {image}
          </Typography>
        </Box>
      </Box>

      <Chip
        label={status}
        color={statusColors[status as keyof typeof statusColors] || 'default'}
        size="small"
        icon={status === 'running' ? <PlayArrow sx={{ fontSize: 12 }} /> : undefined}
        sx={{
          fontFamily: '"JetBrains Mono", monospace',
          textTransform: 'capitalize',
        }}
      />
    </Box>
  );
}
