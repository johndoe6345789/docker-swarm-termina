import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ContainerActions from '../ContainerActions';

describe('ContainerActions', () => {
  const mockOnStart = jest.fn();
  const mockOnStop = jest.fn();
  const mockOnRestart = jest.fn();
  const mockOnRemove = jest.fn();
  const mockOnOpenShell = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all action buttons', () => {
    render(
      <ContainerActions
        status="running"
        isLoading={false}
        onStart={mockOnStart}
        onStop={mockOnStop}
        onRestart={mockOnRestart}
        onRemove={mockOnRemove}
        onOpenShell={mockOnOpenShell}
      />
    );

    expect(screen.getByRole('button', { name: /open shell/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  it('should call onOpenShell when terminal button is clicked', () => {
    render(
      <ContainerActions
        status="running"
        isLoading={false}
        onStart={mockOnStart}
        onStop={mockOnStop}
        onRestart={mockOnRestart}
        onRemove={mockOnRemove}
        onOpenShell={mockOnOpenShell}
      />
    );

    const terminalButton = screen.getByRole('button', { name: /open shell/i });
    fireEvent.click(terminalButton);

    expect(mockOnOpenShell).toHaveBeenCalled();
  });

  it('should call onRestart when restart button is clicked', () => {
    render(
      <ContainerActions
        status="running"
        isLoading={false}
        onStart={mockOnStart}
        onStop={mockOnStop}
        onRestart={mockOnRestart}
        onRemove={mockOnRemove}
        onOpenShell={mockOnOpenShell}
      />
    );

    const restartButton = screen.getByRole('button', { name: /restart/i });
    fireEvent.click(restartButton);

    expect(mockOnRestart).toHaveBeenCalled();
  });

  it('should call onRemove when delete button is clicked', () => {
    render(
      <ContainerActions
        status="running"
        isLoading={false}
        onStart={mockOnStart}
        onStop={mockOnStop}
        onRestart={mockOnRestart}
        onRemove={mockOnRemove}
        onOpenShell={mockOnOpenShell}
      />
    );

    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalled();
  });

  it('should disable buttons when loading', () => {
    render(
      <ContainerActions
        status="running"
        isLoading={true}
        onStart={mockOnStart}
        onStop={mockOnStop}
        onRestart={mockOnRestart}
        onRemove={mockOnRemove}
        onOpenShell={mockOnOpenShell}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });
});
