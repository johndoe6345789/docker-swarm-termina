import React from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Logout, Refresh, Inventory2 } from '@mui/icons-material';
import { DashboardHeaderProps } from '@/lib/interfaces/dashboard';

export default function DashboardHeader({
  containerCount,
  isMobile,
  isRefreshing,
  onRefresh,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: 'rgba(45, 55, 72, 0.5)',
        backdropFilter: 'blur(8px)',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              background: 'rgba(56, 178, 172, 0.1)',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Inventory2 sx={{ color: 'secondary.main' }} />
          </Box>
          <Box>
            <Typography
              variant="h1"
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: { xs: '1.1rem', sm: '1.5rem' }
              }}
            >
              Container Shell
            </Typography>
            {!isMobile && (
              <Typography variant="caption" color="text.secondary">
                {containerCount} active {containerCount === 1 ? 'container' : 'containers'}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {isMobile ? (
            <>
              <IconButton
                color="secondary"
                onClick={onRefresh}
                disabled={isRefreshing}
                size="small"
              >
                {isRefreshing ? <CircularProgress size={20} color="secondary" /> : <Refresh />}
              </IconButton>
              <IconButton
                color="secondary"
                onClick={onLogout}
                size="small"
              >
                <Logout />
              </IconButton>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={onRefresh}
                disabled={isRefreshing}
                startIcon={isRefreshing ? <CircularProgress size={16} color="secondary" /> : <Refresh />}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={onLogout}
                startIcon={<Logout />}
              >
                Logout
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
