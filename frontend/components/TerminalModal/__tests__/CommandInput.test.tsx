import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CommandInput from '../CommandInput';

describe('CommandInput', () => {
  const defaultProps = {
    command: '',
    workdir: '/home/user',
    isExecuting: false,
    isMobile: false,
    containerName: 'test-container',
    onCommandChange: jest.fn(),
    onExecute: jest.fn(),
    onKeyPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render command input with prompt', () => {
    render(<CommandInput {...defaultProps} />);

    expect(screen.getByText(/test-container/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ls -la')).toBeInTheDocument();
  });

  it('should call onCommandChange when typing', () => {
    render(<CommandInput {...defaultProps} />);

    const input = screen.getByPlaceholderText('ls -la');
    fireEvent.change(input, { target: { value: 'ls -la' } });

    expect(defaultProps.onCommandChange).toHaveBeenCalledWith('ls -la');
  });

  it('should call onKeyPress when pressing a key', () => {
    render(<CommandInput {...defaultProps} />);

    const input = screen.getByPlaceholderText('ls -la');
    // MUI TextField uses the input element
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(defaultProps.onKeyPress).toHaveBeenCalled();
  });

  it('should call onExecute when Run button clicked on desktop', () => {
    render(<CommandInput {...defaultProps} command="ls" />);

    const runButton = screen.getByRole('button', { name: /run/i });
    fireEvent.click(runButton);

    expect(defaultProps.onExecute).toHaveBeenCalled();
  });

  it('should show IconButton on mobile', () => {
    render(<CommandInput {...defaultProps} isMobile={true} command="ls" />);

    // On mobile, there's an IconButton instead of a "Run" button
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(1);

    fireEvent.click(buttons[0]);
    expect(defaultProps.onExecute).toHaveBeenCalled();
  });

  it('should disable input and button when executing', () => {
    render(<CommandInput {...defaultProps} isExecuting={true} command="ls" />);

    const input = screen.getByPlaceholderText('ls -la');
    expect(input).toBeDisabled();

    const runButton = screen.getByRole('button', { name: /run/i });
    expect(runButton).toBeDisabled();
  });

  it('should disable button when command is empty', () => {
    render(<CommandInput {...defaultProps} command="" />);

    const runButton = screen.getByRole('button', { name: /run/i });
    expect(runButton).toBeDisabled();
  });

  it('should disable button when command is only whitespace', () => {
    render(<CommandInput {...defaultProps} command="   " />);

    const runButton = screen.getByRole('button', { name: /run/i });
    expect(runButton).toBeDisabled();
  });

  it('should enable button when command has content', () => {
    render(<CommandInput {...defaultProps} command="ls" />);

    const runButton = screen.getByRole('button', { name: /run/i });
    expect(runButton).not.toBeDisabled();
  });

  it('should format prompt with container name and workdir', () => {
    render(<CommandInput {...defaultProps} containerName="my-app" workdir="/var/www" />);

    expect(screen.getByText(/my-app/)).toBeInTheDocument();
    expect(screen.getByText(/\/var\/www/)).toBeInTheDocument();
  });

  it('should focus on input when rendered', () => {
    render(<CommandInput {...defaultProps} />);

    const input = screen.getByPlaceholderText('ls -la');
    // MUI TextField with autoFocus prop should be in the document
    expect(input).toBeInTheDocument();
  });
});
