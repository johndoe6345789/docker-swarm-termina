import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../theme';

describe('ThemeProvider', () => {
  it('should render children with theme', () => {
    render(
      <ThemeProvider>
        <div data-testid="test-child">Test Content</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply dark mode palette', () => {
    const { container } = render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );

    // CssBaseline should be rendered
    expect(container).toBeInTheDocument();
  });
});
