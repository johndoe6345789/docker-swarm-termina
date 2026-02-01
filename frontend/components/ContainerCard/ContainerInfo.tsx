import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { ContainerInfoProps } from '@/lib/interfaces/container';

export default function ContainerInfo({ id, uptime }: ContainerInfoProps) {
  return (
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
        <Tooltip title={id} placement="top" arrow>
          <Typography
            variant="body2"
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {id}
          </Typography>
        </Tooltip>
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
          {uptime}
        </Typography>
      </Box>
    </Box>
  );
}
