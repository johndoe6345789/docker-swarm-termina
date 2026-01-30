'use client';

import { useRouter } from 'next/navigation';
import { Box, Container, Typography, Grid, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import { useAppDispatch } from '@/lib/store/hooks';
import { logout as logoutAction } from '@/lib/store/authSlice';
import { useAuthRedirect } from '@/lib/hooks/useAuthRedirect';
import { useContainerList } from '@/lib/hooks/useContainerList';
import { useTerminalModal } from '@/lib/hooks/useTerminalModal';
import DashboardHeader from '@/components/Dashboard/DashboardHeader';
import EmptyState from '@/components/Dashboard/EmptyState';
import ContainerCard from '@/components/ContainerCard';
import TerminalModal from '@/components/TerminalModal';

export default function Dashboard() {
  const { isAuthenticated, loading: authLoading } = useAuthRedirect('/');
  const dispatch = useAppDispatch();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { containers, isRefreshing, isLoading, error, refreshContainers } = useContainerList(isAuthenticated);
  const { selectedContainer, isTerminalOpen, openTerminal, closeTerminal } = useTerminalModal();

  const handleLogout = async () => {
    await dispatch(logoutAction());
    router.push('/');
  };

  if (authLoading || isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <DashboardHeader
        containerCount={containers.length}
        isMobile={isMobile}
        isRefreshing={isRefreshing}
        onRefresh={refreshContainers}
        onLogout={handleLogout}
      />

      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
        {error && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'error.dark', borderRadius: 1 }}>
            <Typography color="error.contrastText">{error}</Typography>
          </Box>
        )}

        {containers.length === 0 && !isLoading ? (
          <EmptyState />
        ) : (
          <Grid container spacing={3}>
            {containers.map((container) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={container.id}>
                <ContainerCard
                  container={container}
                  onOpenShell={() => openTerminal(container)}
                  onContainerUpdate={refreshContainers}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {selectedContainer && (
        <TerminalModal
          open={isTerminalOpen}
          onClose={closeTerminal}
          containerName={selectedContainer.name}
          containerId={selectedContainer.id}
        />
      )}
    </Box>
  );
}
