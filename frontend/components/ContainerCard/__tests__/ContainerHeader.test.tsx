import React from 'react';
import { render, screen } from '@testing-library/react';
import ContainerHeader from '../ContainerHeader';

describe('ContainerHeader', () => {
  it('renders container name', () => {
    render(
      <ContainerHeader name="test-container" image="nginx:latest" status="running" />
    );

    expect(screen.getByText('test-container')).toBeInTheDocument();
  });

  it('renders container image', () => {
    render(
      <ContainerHeader name="test-container" image="nginx:latest" status="running" />
    );

    expect(screen.getByText('nginx:latest')).toBeInTheDocument();
  });

  it('renders status chip with correct label', () => {
    render(
      <ContainerHeader name="test-container" image="nginx:latest" status="running" />
    );

    expect(screen.getByText('running')).toBeInTheDocument();
  });

  it('applies success color for running status', () => {
    const { container } = render(
      <ContainerHeader name="test-container" image="nginx:latest" status="running" />
    );

    const statusChip = screen.getByText('running').closest('.MuiChip-root');
    expect(statusChip).toHaveClass('MuiChip-colorSuccess');
  });

  it('applies default color for stopped status', () => {
    const { container } = render(
      <ContainerHeader name="test-container" image="nginx:latest" status="stopped" />
    );

    const statusChip = screen.getByText('stopped').closest('.MuiChip-root');
    expect(statusChip).toHaveClass('MuiChip-colorDefault');
  });

  it('applies warning color for paused status', () => {
    const { container } = render(
      <ContainerHeader name="test-container" image="nginx:latest" status="paused" />
    );

    const statusChip = screen.getByText('paused').closest('.MuiChip-root');
    expect(statusChip).toHaveClass('MuiChip-colorWarning');
  });

  it('renders play icon for running containers', () => {
    const { container } = render(
      <ContainerHeader name="test-container" image="nginx:latest" status="running" />
    );

    const playIcon = container.querySelector('[data-testid="PlayArrowIcon"]');
    expect(playIcon).toBeInTheDocument();
  });

  it('does not render play icon for stopped containers', () => {
    const { container } = render(
      <ContainerHeader name="test-container" image="nginx:latest" status="stopped" />
    );

    const playIcon = container.querySelector('[data-testid="PlayArrowIcon"]');
    expect(playIcon).not.toBeInTheDocument();
  });
});
