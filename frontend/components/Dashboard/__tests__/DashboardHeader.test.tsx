import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardHeader from '../DashboardHeader';

describe('DashboardHeader', () => {
  const mockOnRefresh = jest.fn();
  const mockOnLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [0, /0 active containers/i],
    [1, /1 active container/i],
    [5, /5 active containers/i],
    [42, /42 active containers/i],
  ])('should render %i containers with correct pluralization on desktop', (count, expectedText) => {
    render(
      <DashboardHeader
        containerCount={count}
        isMobile={false}
        isRefreshing={false}
        onRefresh={mockOnRefresh}
        onLogout={mockOnLogout}
      />
    );

    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });

  it('should not show container count on mobile', () => {
    render(
      <DashboardHeader
        containerCount={5}
        isMobile={true}
        isRefreshing={false}
        onRefresh={mockOnRefresh}
        onLogout={mockOnLogout}
      />
    );

    expect(screen.queryByText(/5 active containers/i)).not.toBeInTheDocument();
  });

  it('should call onRefresh when refresh button is clicked on desktop', () => {
    render(
      <DashboardHeader
        containerCount={3}
        isMobile={false}
        isRefreshing={false}
        onRefresh={mockOnRefresh}
        onLogout={mockOnLogout}
      />
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    expect(mockOnRefresh).toHaveBeenCalled();
  });

  it('should call onLogout when logout button is clicked on desktop', () => {
    render(
      <DashboardHeader
        containerCount={3}
        isMobile={false}
        isRefreshing={false}
        onRefresh={mockOnRefresh}
        onLogout={mockOnLogout}
      />
    );

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(mockOnLogout).toHaveBeenCalled();
  });

  it('should show loading indicator when refreshing on desktop', () => {
    render(
      <DashboardHeader
        containerCount={3}
        isMobile={false}
        isRefreshing={true}
        onRefresh={mockOnRefresh}
        onLogout={mockOnLogout}
      />
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toContainElement(screen.getByRole('progressbar'));
  });

  it('should not show loading indicator when not refreshing', () => {
    render(
      <DashboardHeader
        containerCount={3}
        isMobile={false}
        isRefreshing={false}
        onRefresh={mockOnRefresh}
        onLogout={mockOnLogout}
      />
    );

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('should render title', () => {
    render(
      <DashboardHeader
        containerCount={3}
        isMobile={false}
        isRefreshing={false}
        onRefresh={mockOnRefresh}
        onLogout={mockOnLogout}
      />
    );

    expect(screen.getByText(/container shell/i)).toBeInTheDocument();
  });

  it('should handle mobile layout with icon buttons', () => {
    const { container } = render(
      <DashboardHeader
        containerCount={3}
        isMobile={true}
        isRefreshing={false}
        onRefresh={mockOnRefresh}
        onLogout={mockOnLogout}
      />
    );

    // On mobile, uses icon buttons instead of text buttons
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);

    // Click the buttons and verify callbacks
    fireEvent.click(buttons[0]); // Refresh
    expect(mockOnRefresh).toHaveBeenCalled();

    fireEvent.click(buttons[1]); // Logout
    expect(mockOnLogout).toHaveBeenCalled();
  });

  it('should show loading indicator when refreshing on mobile', () => {
    render(
      <DashboardHeader
        containerCount={3}
        isMobile={true}
        isRefreshing={true}
        onRefresh={mockOnRefresh}
        onLogout={mockOnLogout}
      />
    );

    // Should show CircularProgress in the refresh button on mobile
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
