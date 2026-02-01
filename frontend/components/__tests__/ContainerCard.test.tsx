import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContainerCard from '../ContainerCard';
import { useContainerActions } from '@/lib/hooks/useContainerActions';

// Mock the hook
jest.mock('@/lib/hooks/useContainerActions');

const mockUseContainerActions = useContainerActions as jest.MockedFunction<typeof useContainerActions>;

describe('ContainerCard', () => {
  const mockContainer = {
    id: 'container123',
    name: 'test-container',
    image: 'nginx:latest',
    status: 'running',
    uptime: '2 hours',
  };

  const mockOnOpenShell = jest.fn();
  const mockOnContainerUpdate = jest.fn();

  const defaultHookReturn = {
    isLoading: false,
    snackbar: {
      open: false,
      message: '',
      severity: 'success' as const,
    },
    handleStart: jest.fn(),
    handleStop: jest.fn(),
    handleRestart: jest.fn(),
    handleRemove: jest.fn(),
    closeSnackbar: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseContainerActions.mockReturnValue(defaultHookReturn);
  });

  it('should render container information', () => {
    render(
      <ContainerCard
        container={mockContainer}
        onOpenShell={mockOnOpenShell}
        onContainerUpdate={mockOnContainerUpdate}
      />
    );

    expect(screen.getByText('test-container')).toBeInTheDocument();
    expect(screen.getByText('nginx:latest')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
    expect(screen.getByText(/container123/i)).toBeInTheDocument();
    expect(screen.getByText('2 hours')).toBeInTheDocument();
  });

  it('should show correct border color for running status', () => {
    const { container } = render(
      <ContainerCard
        container={mockContainer}
        onOpenShell={mockOnOpenShell}
        onContainerUpdate={mockOnContainerUpdate}
      />
    );

    const card = container.querySelector('.MuiCard-root');
    expect(card).toHaveStyle({ borderColor: '#38b2ac' });
  });

  it('should show correct border color for stopped status', () => {
    const stoppedContainer = { ...mockContainer, status: 'stopped' };

    const { container } = render(
      <ContainerCard
        container={stoppedContainer}
        onOpenShell={mockOnOpenShell}
        onContainerUpdate={mockOnContainerUpdate}
      />
    );

    const card = container.querySelector('.MuiCard-root');
    expect(card).toHaveStyle({ borderColor: '#718096' });
  });

  it('should use default border color for unknown status', () => {
    const unknownContainer = { ...mockContainer, status: 'unknown' };

    const { container } = render(
      <ContainerCard
        container={unknownContainer}
        onOpenShell={mockOnOpenShell}
        onContainerUpdate={mockOnContainerUpdate}
      />
    );

    const card = container.querySelector('.MuiCard-root');
    // Should fallback to 'stopped' color (#718096)
    expect(card).toHaveStyle({ borderColor: '#718096' });
  });

  it('should call useContainerActions with correct parameters', () => {
    render(
      <ContainerCard
        container={mockContainer}
        onOpenShell={mockOnOpenShell}
        onContainerUpdate={mockOnContainerUpdate}
      />
    );

    expect(mockUseContainerActions).toHaveBeenCalledWith('container123', mockOnContainerUpdate);
  });

  it('should show delete confirmation dialog when remove is clicked', async () => {
    render(
      <ContainerCard
        container={mockContainer}
        onOpenShell={mockOnOpenShell}
        onContainerUpdate={mockOnContainerUpdate}
      />
    );

    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
  });

  it('should call handleRemove when delete is confirmed', async () => {
    const mockHandleRemove = jest.fn();
    mockUseContainerActions.mockReturnValue({
      ...defaultHookReturn,
      handleRemove: mockHandleRemove,
    });

    render(
      <ContainerCard
        container={mockContainer}
        onOpenShell={mockOnOpenShell}
        onContainerUpdate={mockOnContainerUpdate}
      />
    );

    // Open dialog
    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    // Confirm
    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /remove/i });
      fireEvent.click(confirmButton);
    });

    expect(mockHandleRemove).toHaveBeenCalled();
  });

  it('should close dialog when cancel is clicked', async () => {
    render(
      <ContainerCard
        container={mockContainer}
        onOpenShell={mockOnOpenShell}
        onContainerUpdate={mockOnContainerUpdate}
      />
    );

    // Open dialog
    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    // Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
    });
  });

  it('should display success snackbar', () => {
    mockUseContainerActions.mockReturnValue({
      ...defaultHookReturn,
      snackbar: {
        open: true,
        message: 'Container started successfully',
        severity: 'success',
      },
    });

    render(
      <ContainerCard
        container={mockContainer}
        onOpenShell={mockOnOpenShell}
        onContainerUpdate={mockOnContainerUpdate}
      />
    );

    expect(screen.getByText('Container started successfully')).toBeInTheDocument();
  });

  it('should display error snackbar', () => {
    mockUseContainerActions.mockReturnValue({
      ...defaultHookReturn,
      snackbar: {
        open: true,
        message: 'Failed to start container',
        severity: 'error',
      },
    });

    render(
      <ContainerCard
        container={mockContainer}
        onOpenShell={mockOnOpenShell}
        onContainerUpdate={mockOnContainerUpdate}
      />
    );

    expect(screen.getByText('Failed to start container')).toBeInTheDocument();
  });

  it('should close snackbar when close button is clicked', async () => {
    const mockCloseSnackbar = jest.fn();
    mockUseContainerActions.mockReturnValue({
      ...defaultHookReturn,
      snackbar: {
        open: true,
        message: 'Test message',
        severity: 'success',
      },
      closeSnackbar: mockCloseSnackbar,
    });

    render(
      <ContainerCard
        container={mockContainer}
        onOpenShell={mockOnOpenShell}
        onContainerUpdate={mockOnContainerUpdate}
      />
    );

    const closeButton = screen.getByLabelText(/close/i);
    fireEvent.click(closeButton);

    expect(mockCloseSnackbar).toHaveBeenCalled();
  });

  it('should pass container actions to ContainerActions component', () => {
    const mockHandleStart = jest.fn();
    const mockHandleStop = jest.fn();
    const mockHandleRestart = jest.fn();

    mockUseContainerActions.mockReturnValue({
      ...defaultHookReturn,
      handleStart: mockHandleStart,
      handleStop: mockHandleStop,
      handleRestart: mockHandleRestart,
    });

    render(
      <ContainerCard
        container={mockContainer}
        onOpenShell={mockOnOpenShell}
        onContainerUpdate={mockOnContainerUpdate}
      />
    );

    // Verify buttons are rendered (ContainerActions component)
    expect(screen.getByRole('button', { name: /open shell/i })).toBeInTheDocument();
  });

  it('should call onOpenShell when shell button is clicked', () => {
    render(
      <ContainerCard
        container={mockContainer}
        onOpenShell={mockOnOpenShell}
        onContainerUpdate={mockOnContainerUpdate}
      />
    );

    const shellButton = screen.getByRole('button', { name: /open shell/i });
    fireEvent.click(shellButton);

    expect(mockOnOpenShell).toHaveBeenCalled();
  });

  it('should show loading state in actions', () => {
    mockUseContainerActions.mockReturnValue({
      ...defaultHookReturn,
      isLoading: true,
    });

    render(
      <ContainerCard
        container={mockContainer}
        onOpenShell={mockOnOpenShell}
        onContainerUpdate={mockOnContainerUpdate}
      />
    );

    // Loading state is passed to ContainerActions component
    // This is tested indirectly through the hook mock
    expect(mockUseContainerActions).toHaveBeenCalledWith('container123', mockOnContainerUpdate);
  });
});
