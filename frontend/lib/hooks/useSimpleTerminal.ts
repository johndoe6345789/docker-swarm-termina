import { useState, useRef, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { OutputLine } from '@/lib/interfaces/terminal';

export function useSimpleTerminal(containerId: string) {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [workdir, setWorkdir] = useState('/');
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const executeCommand = async () => {
    if (!command.trim()) return;

    setIsExecuting(true);
    setOutput((prev) => [...prev, {
      type: 'command',
      content: command,
      workdir: workdir
    }]);

    try {
      const result = await apiClient.executeCommand(containerId, command);

      if (result.workdir) {
        setWorkdir(result.workdir);
      }

      if (result.output && result.output.trim()) {
        setOutput((prev) => [...prev, {
          type: result.exit_code === 0 ? 'output' : 'error',
          content: result.output || ''
        }]);
      } else if (command.trim().startsWith('ls')) {
        setOutput((prev) => [...prev, {
          type: 'output',
          content: '(empty directory)'
        }]);
      }
    } catch (error) {
      setOutput((prev) => [...prev, {
        type: 'error',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]);
    } finally {
      setIsExecuting(false);
      setCommand('');
    }
  };

  const reset = () => {
    setOutput([]);
    setCommand('');
    setWorkdir('/');
  };

  return {
    command,
    setCommand,
    output,
    isExecuting,
    workdir,
    outputRef,
    executeCommand,
    reset,
  };
}
