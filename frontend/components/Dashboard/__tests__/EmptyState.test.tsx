import React from 'react';
import { render, screen } from '@testing-library/react';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  it('renders no containers message', () => {
    render(<EmptyState />);

    expect(screen.getByText(/no active containers/i)).toBeInTheDocument();
  });

  it('renders descriptive message', () => {
    render(<EmptyState />);

    expect(
      screen.getByText(/there are currently no running containers to display/i)
    ).toBeInTheDocument();
  });

  it('renders inventory icon', () => {
    const { container } = render(<EmptyState />);

    const icon = container.querySelector('[data-testid="Inventory2Icon"]');
    expect(icon).toBeInTheDocument();
  });
});
