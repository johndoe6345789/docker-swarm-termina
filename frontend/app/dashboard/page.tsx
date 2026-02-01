'use client';

import { Box, Container, Typography, Grid, CircularProgress } from '@mui/material';
import { useDashboard } from '@/lib/hooks/useDashboard';
import DashboardHeader from '@/components/Dashboard/DashboardHeader';
import EmptyState from '@/components/Dashboard/EmptyState';
import ContainerCard from '@/components/ContainerCard';
import TerminalModal from '@/components/TerminalModal';

export default function Dashboard() {
  const {
    containers,
    isRefreshing,
    error,
    refreshContainers,
    selectedContainer,
    isTerminalOpen,
    openTerminal,
    closeTerminal,
    isMobile,
    isInitialLoading,
    showEmptyState,
    handleLogout,
  } = useDashboard();

  if (isInitialLoading) {
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

        {showEmptyState ? (
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
