import React from 'react';
import { Box, Typography } from '@mui/material';
import { Inventory2 } from '@mui/icons-material';

export default function EmptyState() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          backgroundColor: 'action.hover',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        <Inventory2 sx={{ fontSize: 40, color: 'text.secondary' }} />
      </Box>
      <Typography variant="h2" gutterBottom>
        No Active Containers
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 500 }}>
        There are currently no running containers to display. Start a container to see it appear here.
      </Typography>
    </Box>
  );
}
