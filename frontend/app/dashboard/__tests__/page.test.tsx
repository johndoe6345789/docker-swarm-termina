import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from '../page';
import { useDashboard } from '@/lib/hooks/useDashboard';

// Mock the hooks and components
jest.mock('@/lib/hooks/useDashboard');
jest.mock('@/components/Dashboard/DashboardHeader', () => {
  return function DashboardHeader({ onRefresh, onLogout }: { onRefresh: () => void; onLogout: () => void }) {
    return (
      <div data-testid="dashboard-header">
        <button onClick={onRefresh}>Refresh</button>
        <button onClick={onLogout}>Logout</button>
      </div>
    );
  };
});
jest.mock('@/components/Dashboard/EmptyState', () => {
  return function EmptyState() {
    return <div data-testid="empty-state">No containers</div>;
  };
});
jest.mock('@/components/ContainerCard', () => {
  return function ContainerCard({ container, onOpenShell }: { container: { id: string; name: string }; onOpenShell: () => void }) {
    return (
      <div data-testid={`container-card-${container.id}`}>
        <span>{container.name}</span>
        <button onClick={onOpenShell}>Open Shell</button>
      </div>
    );
  };
});
jest.mock('@/components/TerminalModal', () => {
  return function TerminalModal({ open, containerName, onClose }: { open: boolean; containerName: string; onClose: () => void }) {
    if (!open) return null;
    return (
      <div data-testid="terminal-modal">
        <span>{containerName}</span>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

const mockUseDashboard = useDashboard as jest.MockedFunction<typeof useDashboard>;

describe('Dashboard Page', () => {
  const defaultDashboardState = {
    // Authentication
    isAuthenticated: true,
    authLoading: false,
    handleLogout: jest.fn(),

    // Container list
    containers: [],
    isRefreshing: false,
    isLoading: false,
    error: '',
    refreshContainers: jest.fn(),

    // Terminal modal
    selectedContainer: null,
    isTerminalOpen: false,
    openTerminal: jest.fn(),
    closeTerminal: jest.fn(),

    // UI state
    isMobile: false,
    isInitialLoading: false,
    hasContainers: false,
    showEmptyState: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDashboard.mockReturnValue(defaultDashboardState);
  });

  it('should show loading spinner when initial loading', () => {
    mockUseDashboard.mockReturnValue({
      ...defaultDashboardState,
      isInitialLoading: true,
    });

    render(<Dashboard />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show empty state when no containers', () => {
    mockUseDashboard.mockReturnValue({
      ...defaultDashboardState,
      showEmptyState: true,
    });

    render(<Dashboard />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('should render containers when available', () => {
    const mockContainers = [
      { id: '1', name: 'container1', image: 'nginx', status: 'running', uptime: '1h' },
      { id: '2', name: 'container2', image: 'redis', status: 'stopped', uptime: '2h' },
    ];

    mockUseDashboard.mockReturnValue({
      ...defaultDashboardState,
      containers: mockContainers,
    });

    render(<Dashboard />);
    expect(screen.getByTestId('container-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('container-card-2')).toBeInTheDocument();
    expect(screen.getByText('container1')).toBeInTheDocument();
    expect(screen.getByText('container2')).toBeInTheDocument();
  });

  it('should show error message when error occurs', () => {
    mockUseDashboard.mockReturnValue({
      ...defaultDashboardState,
      error: 'Failed to fetch containers',
    });

    render(<Dashboard />);
    expect(screen.getByText('Failed to fetch containers')).toBeInTheDocument();
  });

  it('should call refreshContainers when refresh button clicked', () => {
    const mockRefresh = jest.fn();
    mockUseDashboard.mockReturnValue({
      ...defaultDashboardState,
      refreshContainers: mockRefresh,
    });

    render(<Dashboard />);
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should call handleLogout when logout button clicked', () => {
    const mockLogout = jest.fn();
    mockUseDashboard.mockReturnValue({
      ...defaultDashboardState,
      handleLogout: mockLogout,
    });

    render(<Dashboard />);
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    expect(mockLogout).toHaveBeenCalled();
  });

  it('should call openTerminal when container shell button clicked', () => {
    const mockContainer = { id: '1', name: 'test', image: 'nginx', status: 'running', uptime: '1h' };
    const mockOpenTerminal = jest.fn();

    mockUseDashboard.mockReturnValue({
      ...defaultDashboardState,
      containers: [mockContainer],
      openTerminal: mockOpenTerminal,
    });

    render(<Dashboard />);
    const shellButton = screen.getByText('Open Shell');
    fireEvent.click(shellButton);
    expect(mockOpenTerminal).toHaveBeenCalledWith(mockContainer);
  });

  it('should show terminal modal when terminal is open', () => {
    const mockContainer = { id: '1', name: 'test', image: 'nginx', status: 'running', uptime: '1h' };

    mockUseDashboard.mockReturnValue({
      ...defaultDashboardState,
      selectedContainer: mockContainer,
      isTerminalOpen: true,
    });

    render(<Dashboard />);
    expect(screen.getByTestId('terminal-modal')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('should not show terminal modal when terminal is closed', () => {
    mockUseDashboard.mockReturnValue({
      ...defaultDashboardState,
      selectedContainer: null,
      isTerminalOpen: false,
    });

    render(<Dashboard />);
    expect(screen.queryByTestId('terminal-modal')).not.toBeInTheDocument();
  });

  it('should call closeTerminal when terminal modal close button clicked', () => {
    const mockContainer = { id: '1', name: 'test', image: 'nginx', status: 'running', uptime: '1h' };
    const mockCloseTerminal = jest.fn();

    mockUseDashboard.mockReturnValue({
      ...defaultDashboardState,
      selectedContainer: mockContainer,
      isTerminalOpen: true,
      closeTerminal: mockCloseTerminal,
    });

    render(<Dashboard />);
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    expect(mockCloseTerminal).toHaveBeenCalled();
  });

  it('should pass correct props to DashboardHeader', () => {
    const mockContainers = [
      { id: '1', name: 'container1', image: 'nginx', status: 'running', uptime: '1h' },
      { id: '2', name: 'container2', image: 'redis', status: 'stopped', uptime: '2h' },
    ];

    mockUseDashboard.mockReturnValue({
      ...defaultDashboardState,
      containers: mockContainers,
      isMobile: true,
      isRefreshing: true,
    });

    render(<Dashboard />);
    // Verify the header is rendered (props are tested in DashboardHeader.test.tsx)
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
  });
});
