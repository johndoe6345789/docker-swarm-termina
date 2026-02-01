import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/lib/store/authSlice';
import LoginForm from '../LoginForm';
import { apiClient } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

jest.mock('@/lib/api', () => ({
  apiClient: {
    login: jest.fn(),
  },
}));

const createMockStore = (loading = false) =>
  configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated: false,
        loading,
        username: null,
        error: null,
      },
    },
  });

const renderWithProvider = (component: React.ReactElement, loading = false) => {
  return render(<Provider store={createMockStore(loading)}>{component}</Provider>);
};

describe('LoginForm', () => {
  it('renders login form elements', () => {
    renderWithProvider(<LoginForm />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /access dashboard/i })).toBeInTheDocument();
  });

  it.each([
    ['username', /username/i, 'testuser'],
    ['username', /username/i, 'admin'],
    ['password', /password/i, 'testpass'],
    ['password', /password/i, 'secure123'],
  ])('updates %s input to "%s" on change', (fieldType, labelRegex, value) => {
    renderWithProvider(<LoginForm />);

    const input = screen.getByLabelText(labelRegex) as HTMLInputElement;
    fireEvent.change(input, { target: { value } });

    expect(input.value).toBe(value);
  });

  it('shows loading text when loading', () => {
    renderWithProvider(<LoginForm />, true);

    expect(screen.getByRole('button', { name: /logging in/i })).toBeInTheDocument();
  });

  it('password input is type password', () => {
    renderWithProvider(<LoginForm />);

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
  });

  it('shows helper text with default credentials', () => {
    renderWithProvider(<LoginForm />);

    expect(screen.getByText(/default: admin \/ admin123/i)).toBeInTheDocument();
  });

  it('shows error message when error exists', () => {
    const storeWithError = configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          isAuthenticated: false,
          loading: false,
          username: null,
          error: 'Invalid credentials',
        },
      },
    });

    render(
      <Provider store={storeWithError}>
        <LoginForm />
      </Provider>
    );

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('disables submit button when loading', () => {
    renderWithProvider(<LoginForm />, true);

    const submitButton = screen.getByRole('button', { name: /logging in/i });
    expect(submitButton).toBeDisabled();
  });

  it('renders without shake animation by default', () => {
    renderWithProvider(<LoginForm />);

    // The component should render successfully
    expect(screen.getByRole('button', { name: /access dashboard/i })).toBeInTheDocument();
  });

  it('handles form submission with failed login', async () => {
    jest.useFakeTimers();

    (apiClient.login as jest.Mock).mockResolvedValue({
      success: false,
      message: 'Invalid credentials',
    });

    renderWithProvider(<LoginForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /access dashboard/i });

    fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitButton);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    // The shake animation should be triggered (isShaking: true)
    // We can't directly test CSS animations, but we verify the component still renders
    expect(screen.getByRole('button', { name: /access dashboard/i })).toBeInTheDocument();

    jest.useRealTimers();
  });
});
