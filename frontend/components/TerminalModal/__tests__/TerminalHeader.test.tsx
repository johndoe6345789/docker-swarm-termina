import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TerminalHeader from '../TerminalHeader';

describe('TerminalHeader', () => {
  const mockOnClose = jest.fn();
  const mockOnModeChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders container name', () => {
    render(
      <TerminalHeader
        containerName="test-container"
        mode="interactive"
        interactiveFailed={false}
        onModeChange={mockOnModeChange}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/Terminal - test-container/i)).toBeInTheDocument();
  });

  it('renders interactive and simple mode buttons', () => {
    render(
      <TerminalHeader
        containerName="test-container"
        mode="interactive"
        interactiveFailed={false}
        onModeChange={mockOnModeChange}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Interactive')).toBeInTheDocument();
    expect(screen.getByText('Simple')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <TerminalHeader
        containerName="test-container"
        mode="interactive"
        interactiveFailed={false}
        onModeChange={mockOnModeChange}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows warning icon when interactive mode failed', () => {
    const { container } = render(
      <TerminalHeader
        containerName="test-container"
        mode="simple"
        interactiveFailed={true}
        onModeChange={mockOnModeChange}
        onClose={mockOnClose}
      />
    );

    const warningIcon = container.querySelector('[data-testid="WarningIcon"]');
    expect(warningIcon).toBeInTheDocument();
  });

  it('applies correct mode selection', () => {
    render(
      <TerminalHeader
        containerName="test-container"
        mode="simple"
        interactiveFailed={false}
        onModeChange={mockOnModeChange}
        onClose={mockOnClose}
      />
    );

    const simpleButton = screen.getByText('Simple').closest('button');
    expect(simpleButton).toHaveClass('Mui-selected');
  });
});
