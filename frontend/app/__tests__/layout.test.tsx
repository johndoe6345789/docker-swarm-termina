import React from 'react';
import { render, screen } from '@testing-library/react';
import RootLayout, { metadata } from '../layout';

// Suppress console.error for DOM nesting warnings in tests
// (html cannot be child of div - expected when testing Next.js RootLayout)
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn((...args) => {
    const message = args.map(arg => String(arg)).join(' ');
    // Suppress DOM nesting warnings that occur when testing RootLayout
    if (message.includes('cannot be a child of') || message.includes('hydration error')) {
      return;
    }
    originalConsoleError.apply(console, args);
  });
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Mock the ThemeProvider and Providers
jest.mock('@/lib/theme', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>,
}));

jest.mock('../providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => <div data-testid="providers">{children}</div>,
}));

// Mock Next.js Script component
jest.mock('next/script', () => {
  return function Script(props: any) {
    return <script data-testid="next-script" {...props} />;
  };
});

describe('RootLayout', () => {
  it('should have correct metadata', () => {
    expect(metadata.title).toBe('Container Shell - Docker Swarm Terminal');
    expect(metadata.description).toBe('Docker container management terminal web UI');
  });

  it('should render children within providers', () => {
    render(
      <RootLayout>
        <div data-testid="test-child">Test Content</div>
      </RootLayout>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByTestId('providers')).toBeInTheDocument();
  });

  it('should render with proper structure', () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="content">Content</div>
      </RootLayout>
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(container).toBeInTheDocument();
  });
});
