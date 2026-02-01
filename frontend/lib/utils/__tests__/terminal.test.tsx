import { render } from '@testing-library/react';
import { formatPrompt, highlightCommand } from '../terminal';
import { OutputLine } from '@/lib/interfaces/terminal';

describe('formatPrompt', () => {
  it('formats a simple prompt correctly', () => {
    const result = formatPrompt('test-container', '/home/user');
    expect(result).toBe('root@test-container:/home/user#');
  });

  it('truncates long directory paths', () => {
    const longPath = '/very/long/directory/path/that/is/over/thirty/characters';
    const result = formatPrompt('test-container', longPath);
    expect(result).toContain('...');
    expect(result).toContain('characters');
    expect(result).toMatch(/^root@test-container:\.\.\.\/characters#$/);
  });

  it('handles root directory', () => {
    const result = formatPrompt('test-container', '/');
    expect(result).toBe('root@test-container:/#');
  });

  it('handles container names with special characters', () => {
    const result = formatPrompt('my-container-123', '/app');
    expect(result).toBe('root@my-container-123:/app#');
  });
});

describe('highlightCommand', () => {
  it('renders command output with proper formatting', () => {
    const line: OutputLine = {
      type: 'command',
      content: 'ls -la',
      workdir: '/home/user',
    };

    const { container } = render(highlightCommand(line, 'test-container'));
    expect(container.textContent).toContain('root@test-container:/home/user#');
    expect(container.textContent).toContain('ls');
    expect(container.textContent).toContain('-la');
  });

  it('renders command with no arguments', () => {
    const line: OutputLine = {
      type: 'command',
      content: 'pwd',
      workdir: '/app',
    };

    const { container } = render(highlightCommand(line, 'test-container'));
    expect(container.textContent).toContain('pwd');
  });

  it('renders error output with red color', () => {
    const line: OutputLine = {
      type: 'error',
      content: 'Error: command not found',
    };

    const { container } = render(highlightCommand(line, 'test-container'));
    const errorDiv = container.querySelector('div');
    expect(errorDiv).toHaveStyle({ color: '#FF5555' });
    expect(container.textContent).toContain('Error: command not found');
  });

  it('renders regular output', () => {
    const line: OutputLine = {
      type: 'output',
      content: 'Hello world',
    };

    const { container } = render(highlightCommand(line, 'test-container'));
    expect(container.textContent).toContain('Hello world');
  });

  it('preserves whitespace in output', () => {
    const line: OutputLine = {
      type: 'output',
      content: 'Line 1\nLine 2',
    };

    const { container } = render(highlightCommand(line, 'test-container'));
    const outputDiv = container.querySelector('div');
    expect(outputDiv).toHaveStyle({ whiteSpace: 'pre-wrap' });
  });

  it('uses default workdir when not provided', () => {
    const line: OutputLine = {
      type: 'command',
      content: 'echo test',
    };

    const { container } = render(highlightCommand(line, 'test-container'));
    expect(container.textContent).toContain('root@test-container:/#');
  });
});
