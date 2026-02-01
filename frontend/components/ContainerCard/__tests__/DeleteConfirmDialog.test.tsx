import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DeleteConfirmDialog from '../DeleteConfirmDialog';

describe('DeleteConfirmDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dialog when open', () => {
    render(
      <DeleteConfirmDialog
        open={true}
        containerName="test-container"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    expect(screen.getByText(/test-container/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const { container } = render(
      <DeleteConfirmDialog
        open={false}
        containerName="test-container"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('should call onConfirm when remove button is clicked', () => {
    render(
      <DeleteConfirmDialog
        open={true}
        containerName="test-container"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <DeleteConfirmDialog
        open={true}
        containerName="test-container"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show warning message', () => {
    render(
      <DeleteConfirmDialog
        open={true}
        containerName="test-container"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
  });
});
