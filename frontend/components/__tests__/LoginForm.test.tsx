import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/lib/store/authSlice';
import LoginForm from '../LoginForm';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
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

  it('updates username input on change', () => {
    renderWithProvider(<LoginForm />);

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });

    expect(usernameInput.value).toBe('testuser');
  });

  it('updates password input on change', () => {
    renderWithProvider(<LoginForm />);

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });

    expect(passwordInput.value).toBe('testpass');
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
});
