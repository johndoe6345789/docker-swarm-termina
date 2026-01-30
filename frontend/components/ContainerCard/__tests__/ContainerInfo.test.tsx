import React from 'react';
import { render, screen } from '@testing-library/react';
import ContainerInfo from '../ContainerInfo';

describe('ContainerInfo', () => {
  it('renders container ID label', () => {
    render(<ContainerInfo id="abc123def456" uptime="2 hours" />);

    expect(screen.getByText(/container id/i)).toBeInTheDocument();
  });

  it('renders container ID value', () => {
    render(<ContainerInfo id="abc123def456" uptime="2 hours" />);

    expect(screen.getByText('abc123def456')).toBeInTheDocument();
  });

  it('renders uptime label', () => {
    render(<ContainerInfo id="abc123def456" uptime="2 hours" />);

    expect(screen.getByText(/uptime/i)).toBeInTheDocument();
  });

  it('renders uptime value', () => {
    render(<ContainerInfo id="abc123def456" uptime="2 hours" />);

    expect(screen.getByText('2 hours')).toBeInTheDocument();
  });

  it('renders different uptime formats correctly', () => {
    const { rerender } = render(<ContainerInfo id="abc123" uptime="5 minutes" />);
    expect(screen.getByText('5 minutes')).toBeInTheDocument();

    rerender(<ContainerInfo id="abc123" uptime="3 days" />);
    expect(screen.getByText('3 days')).toBeInTheDocument();

    rerender(<ContainerInfo id="abc123" uptime="1 month" />);
    expect(screen.getByText('1 month')).toBeInTheDocument();
  });
});
