import React from 'react';
import { render, screen } from '@testing-library/react';
import { Providers } from '../providers';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

describe('Providers', () => {
  it('should render children', () => {
    render(
      <Providers>
        <div data-testid="test-child">Test Content</div>
      </Providers>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('should wrap children with Redux Provider', () => {
    const { container } = render(
      <Providers>
        <div data-testid="test-content">Content</div>
      </Providers>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(container).toBeInTheDocument();
  });
});
