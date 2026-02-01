import { renderHook, act, waitFor } from '@testing-library/react';
import { useSimpleTerminal } from '../useSimpleTerminal';
import { apiClient } from '@/lib/api';

jest.mock('@/lib/api');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock apiClient.executeCommand - note the different method name
(mockApiClient as any).executeCommand = jest.fn();

describe('useSimpleTerminal', () => {
  const containerId = 'container123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useSimpleTerminal(containerId));

    expect(result.current.command).toBe('');
    expect(result.current.output).toEqual([]);
    expect(result.current.isExecuting).toBe(false);
    expect(result.current.workdir).toBe('/');
  });

  it('should update command', () => {
    const { result } = renderHook(() => useSimpleTerminal(containerId));

    act(() => {
      result.current.setCommand('ls -la');
    });

    expect(result.current.command).toBe('ls -la');
  });

  it('should execute command successfully', async () => {
    (mockApiClient as any).executeCommand.mockResolvedValueOnce({
      output: 'file1.txt\nfile2.txt',
      exit_code: 0,
      workdir: '/',
    });

    const { result } = renderHook(() => useSimpleTerminal(containerId));

    act(() => {
      result.current.setCommand('ls');
    });

    await act(async () => {
      await result.current.executeCommand();
    });

    expect((mockApiClient as any).executeCommand).toHaveBeenCalledWith(containerId, 'ls');
    expect(result.current.output).toHaveLength(2);
    expect(result.current.output[0].type).toBe('command');
    expect(result.current.output[0].content).toBe('ls');
    expect(result.current.output[1].type).toBe('output');
    expect(result.current.output[1].content).toBe('file1.txt\nfile2.txt');
    expect(result.current.command).toBe('');
  });

  it('should not execute empty command', async () => {
    const { result } = renderHook(() => useSimpleTerminal(containerId));

    act(() => {
      result.current.setCommand('');
    });

    await act(async () => {
      await result.current.executeCommand();
    });

    expect((mockApiClient as any).executeCommand).not.toHaveBeenCalled();
  });

  it('should not execute whitespace-only command', async () => {
    const { result } = renderHook(() => useSimpleTerminal(containerId));

    act(() => {
      result.current.setCommand('   ');
    });

    await act(async () => {
      await result.current.executeCommand();
    });

    expect((mockApiClient as any).executeCommand).not.toHaveBeenCalled();
  });

  it('should handle command error', async () => {
    (mockApiClient as any).executeCommand.mockRejectedValueOnce(new Error('Command failed'));

    const { result } = renderHook(() => useSimpleTerminal(containerId));

    act(() => {
      result.current.setCommand('invalid');
    });

    await act(async () => {
      await result.current.executeCommand();
    });

    expect(result.current.output).toHaveLength(2);
    expect(result.current.output[0].type).toBe('command');
    expect(result.current.output[1].type).toBe('error');
    expect(result.current.output[1].content).toContain('Command failed');
  });

  it('should handle non-Error objects', async () => {
    (mockApiClient as any).executeCommand.mockRejectedValueOnce('String error');

    const { result } = renderHook(() => useSimpleTerminal(containerId));

    act(() => {
      result.current.setCommand('test');
    });

    await act(async () => {
      await result.current.executeCommand();
    });

    expect(result.current.output[1].content).toContain('Unknown error');
  });

  it('should update workdir from command result', async () => {
    (mockApiClient as any).executeCommand.mockResolvedValueOnce({
      output: '',
      exit_code: 0,
      workdir: '/tmp',
    });

    const { result } = renderHook(() => useSimpleTerminal(containerId));

    act(() => {
      result.current.setCommand('cd /tmp');
    });

    await act(async () => {
      await result.current.executeCommand();
    });

    expect(result.current.workdir).toBe('/tmp');
  });

  it('should show error type for non-zero exit code', async () => {
    (mockApiClient as any).executeCommand.mockResolvedValueOnce({
      output: 'command not found',
      exit_code: 127,
      workdir: '/',
    });

    const { result } = renderHook(() => useSimpleTerminal(containerId));

    act(() => {
      result.current.setCommand('invalid_cmd');
    });

    await act(async () => {
      await result.current.executeCommand();
    });

    expect(result.current.output[1].type).toBe('error');
    expect(result.current.output[1].content).toBe('command not found');
  });

  it('should show empty directory message for ls with no output', async () => {
    (mockApiClient as any).executeCommand.mockResolvedValueOnce({
      output: '',
      exit_code: 0,
      workdir: '/',
    });

    const { result } = renderHook(() => useSimpleTerminal(containerId));

    act(() => {
      result.current.setCommand('ls');
    });

    await act(async () => {
      await result.current.executeCommand();
    });

    expect(result.current.output[1].type).toBe('output');
    expect(result.current.output[1].content).toBe('(empty directory)');
  });

  it('should not show empty directory message for non-ls commands', async () => {
    (mockApiClient as any).executeCommand.mockResolvedValueOnce({
      output: '',
      exit_code: 0,
      workdir: '/',
    });

    const { result } = renderHook(() => useSimpleTerminal(containerId));

    act(() => {
      result.current.setCommand('pwd');
    });

    await act(async () => {
      await result.current.executeCommand();
    });

    // Should only have command output, no additional empty directory message
    expect(result.current.output).toHaveLength(1);
  });

  it('should reset terminal', () => {
    const { result } = renderHook(() => useSimpleTerminal(containerId));

    act(() => {
      result.current.setCommand('test command');
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.command).toBe('');
    expect(result.current.output).toEqual([]);
    expect(result.current.workdir).toBe('/');
  });

  it('should set isExecuting during command execution', async () => {
    let resolveExecute: (value: any) => void;
    const executePromise = new Promise((resolve) => {
      resolveExecute = resolve;
    });

    (mockApiClient as any).executeCommand.mockReturnValue(executePromise);

    const { result } = renderHook(() => useSimpleTerminal(containerId));

    act(() => {
      result.current.setCommand('ls');
    });

    act(() => {
      result.current.executeCommand();
    });

    await waitFor(() => {
      expect(result.current.isExecuting).toBe(true);
    });

    await act(async () => {
      resolveExecute!({ output: '', exit_code: 0, workdir: '/' });
    });

    await waitFor(() => {
      expect(result.current.isExecuting).toBe(false);
    });
  });

  it('should include workdir in command output', async () => {
    (mockApiClient as any).executeCommand.mockResolvedValueOnce({
      output: 'test',
      exit_code: 0,
      workdir: '/home/user',
    });

    const { result } = renderHook(() => useSimpleTerminal(containerId));

    act(() => {
      result.current.setCommand('pwd');
    });

    await act(async () => {
      await result.current.executeCommand();
    });

    // The command OutputLine has the workdir from BEFORE command execution ('/')
    expect(result.current.output[0].workdir).toBe('/');
    // The hook state is updated to the NEW workdir from the result
    expect(result.current.workdir).toBe('/home/user');
  });
});
