import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../page';
import { useAuthRedirect } from '@/lib/hooks/useAuthRedirect';

// Mock the hooks and components
jest.mock('@/lib/hooks/useAuthRedirect');
jest.mock('@/components/LoginForm', () => {
  return function LoginForm() {
    return <div data-testid="login-form">Login Form</div>;
  };
});

const mockUseAuthRedirect = useAuthRedirect as jest.MockedFunction<typeof useAuthRedirect>;

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render null when loading', () => {
    mockUseAuthRedirect.mockReturnValue({
      isAuthenticated: false,
      loading: true,
    });

    const { container } = render(<Home />);
    expect(container.firstChild).toBeNull();
  });

  it('should render LoginForm when not loading and not authenticated', () => {
    mockUseAuthRedirect.mockReturnValue({
      isAuthenticated: false,
      loading: false,
    });

    render(<Home />);
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });

  it('should call useAuthRedirect with /dashboard redirect path', () => {
    mockUseAuthRedirect.mockReturnValue({
      isAuthenticated: false,
      loading: false,
    });

    render(<Home />);
    expect(mockUseAuthRedirect).toHaveBeenCalledWith('/dashboard');
  });
});
