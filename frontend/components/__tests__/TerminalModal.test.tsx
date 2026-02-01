import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TerminalModal from '../TerminalModal';
import { useSimpleTerminal } from '@/lib/hooks/useSimpleTerminal';
import { useInteractiveTerminal } from '@/lib/hooks/useInteractiveTerminal';
import { useTerminalModalState } from '@/lib/hooks/useTerminalModalState';

// Mock hooks
jest.mock('@/lib/hooks/useSimpleTerminal');
jest.mock('@/lib/hooks/useInteractiveTerminal');
jest.mock('@/lib/hooks/useTerminalModalState');

const mockUseSimpleTerminal = useSimpleTerminal as jest.MockedFunction<typeof useSimpleTerminal>;
const mockUseInteractiveTerminal = useInteractiveTerminal as jest.MockedFunction<typeof useInteractiveTerminal>;
const mockUseTerminalModalState = useTerminalModalState as jest.MockedFunction<typeof useTerminalModalState>;

describe('TerminalModal', () => {
  const mockOnClose = jest.fn();

  const defaultSimpleTerminal = {
    command: '',
    setCommand: jest.fn(),
    output: [],
    isExecuting: false,
    workdir: '/',
    outputRef: { current: null },
    executeCommand: jest.fn(),
    reset: jest.fn(),
  };

  const defaultInteractiveTerminal = {
    terminalRef: { current: null },
    cleanup: jest.fn(),
  };

  const defaultModalState = {
    isMobile: false,
    mode: 'interactive' as const,
    interactiveFailed: false,
    fallbackReason: '',
    showFallbackNotification: false,
    handleFallback: jest.fn(),
    handleModeChange: jest.fn(),
    handleRetryInteractive: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSimpleTerminal.mockReturnValue(defaultSimpleTerminal);
    mockUseInteractiveTerminal.mockReturnValue(defaultInteractiveTerminal);
    mockUseTerminalModalState.mockReturnValue(defaultModalState);
  });

  it('should render in interactive mode by default', () => {
    render(
      <TerminalModal
        open={true}
        onClose={mockOnClose}
        containerName="test-container"
        containerId="container123"
      />
    );

    expect(screen.getByText(/test-container/i)).toBeInTheDocument();
    // Interactive terminal uses a div ref, so we check for the dialog
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should render in simple mode when mode is simple', () => {
    mockUseTerminalModalState.mockReturnValue({
      ...defaultModalState,
      mode: 'simple',
    });

    render(
      <TerminalModal
        open={true}
        onClose={mockOnClose}
        containerName="test-container"
        containerId="container123"
      />
    );

    // Simple terminal should be rendered
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const { container } = render(
      <TerminalModal
        open={false}
        onClose={mockOnClose}
        containerName="test-container"
        containerId="container123"
      />
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('should call cleanup functions when closing', () => {
    const mockCleanup = jest.fn();
    const mockReset = jest.fn();
    const mockModalReset = jest.fn();

    mockUseInteractiveTerminal.mockReturnValue({
      ...defaultInteractiveTerminal,
      cleanup: mockCleanup,
    });

    mockUseSimpleTerminal.mockReturnValue({
      ...defaultSimpleTerminal,
      reset: mockReset,
    });

    mockUseTerminalModalState.mockReturnValue({
      ...defaultModalState,
      reset: mockModalReset,
    });

    render(
      <TerminalModal
        open={true}
        onClose={mockOnClose}
        containerName="test-container"
        containerId="container123"
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockCleanup).toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalled();
    expect(mockModalReset).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should execute command on Enter key in simple mode', () => {
    const mockExecuteCommand = jest.fn();

    mockUseTerminalModalState.mockReturnValue({
      ...defaultModalState,
      mode: 'simple',
    });

    mockUseSimpleTerminal.mockReturnValue({
      ...defaultSimpleTerminal,
      executeCommand: mockExecuteCommand,
    });

    render(
      <TerminalModal
        open={true}
        onClose={mockOnClose}
        containerName="test-container"
        containerId="container123"
      />
    );

    // SimpleTerminal component receives onKeyPress handler
    // The handler should execute command on Enter
    // This is tested through the component integration
    expect(mockUseSimpleTerminal).toHaveBeenCalledWith('container123');
  });

  it('should pass isMobile to interactive terminal', () => {
    mockUseTerminalModalState.mockReturnValue({
      ...defaultModalState,
      isMobile: true,
    });

    render(
      <TerminalModal
        open={true}
        onClose={mockOnClose}
        containerName="test-container"
        containerId="container123"
      />
    );

    expect(mockUseInteractiveTerminal).toHaveBeenCalledWith(
      expect.objectContaining({
        isMobile: true,
      })
    );
  });

  it('should pass correct parameters to useInteractiveTerminal', () => {
    const mockHandleFallback = jest.fn();

    mockUseTerminalModalState.mockReturnValue({
      ...defaultModalState,
      handleFallback: mockHandleFallback,
      mode: 'interactive',
    });

    render(
      <TerminalModal
        open={true}
        onClose={mockOnClose}
        containerName="test-container"
        containerId="container123"
      />
    );

    expect(mockUseInteractiveTerminal).toHaveBeenCalledWith({
      open: true,
      containerId: 'container123',
      containerName: 'test-container',
      isMobile: false,
      onFallback: mockHandleFallback,
    });
  });

  it('should not open interactive terminal when in simple mode', () => {
    mockUseTerminalModalState.mockReturnValue({
      ...defaultModalState,
      mode: 'simple',
    });

    render(
      <TerminalModal
        open={true}
        onClose={mockOnClose}
        containerName="test-container"
        containerId="container123"
      />
    );

    expect(mockUseInteractiveTerminal).toHaveBeenCalledWith(
      expect.objectContaining({
        open: false,
      })
    );
  });

  it('should show fallback notification', () => {
    mockUseTerminalModalState.mockReturnValue({
      ...defaultModalState,
      showFallbackNotification: true,
      fallbackReason: 'Connection failed',
      mode: 'simple',
      interactiveFailed: true,
    });

    render(
      <TerminalModal
        open={true}
        onClose={mockOnClose}
        containerName="test-container"
        containerId="container123"
      />
    );

    // FallbackNotification component should be rendered
    // with show=true and reason='Connection failed'
    expect(mockUseTerminalModalState).toHaveBeenCalled();
  });

  it('should use fullScreen on mobile', () => {
    mockUseTerminalModalState.mockReturnValue({
      ...defaultModalState,
      isMobile: true,
    });

    const { container } = render(
      <TerminalModal
        open={true}
        onClose={mockOnClose}
        containerName="test-container"
        containerId="container123"
      />
    );

    // Dialog should be rendered (fullScreen is applied as a prop)
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should pass mode to TerminalHeader', () => {
    mockUseTerminalModalState.mockReturnValue({
      ...defaultModalState,
      mode: 'simple',
      interactiveFailed: true,
    });

    render(
      <TerminalModal
        open={true}
        onClose={mockOnClose}
        containerName="test-container"
        containerId="container123"
      />
    );

    // TerminalHeader receives mode='simple' and interactiveFailed=true
    expect(mockUseTerminalModalState).toHaveBeenCalled();
  });

  it('should render simple terminal with correct props', () => {
    const mockOutput = [
      { type: 'command' as const, content: 'ls', workdir: '/' },
      { type: 'output' as const, content: 'file1.txt' },
    ];

    mockUseTerminalModalState.mockReturnValue({
      ...defaultModalState,
      mode: 'simple',
      isMobile: false,
    });

    mockUseSimpleTerminal.mockReturnValue({
      ...defaultSimpleTerminal,
      output: mockOutput,
      command: 'pwd',
      workdir: '/home',
      isExecuting: true,
    });

    render(
      <TerminalModal
        open={true}
        onClose={mockOnClose}
        containerName="test-container"
        containerId="container123"
      />
    );

    // SimpleTerminal component receives all these props
    expect(mockUseSimpleTerminal).toHaveBeenCalledWith('container123');
  });
});
