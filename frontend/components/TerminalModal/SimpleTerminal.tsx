import React from 'react';
import { OutputLine } from '@/lib/hooks/useSimpleTerminal';
import TerminalOutput from './TerminalOutput';
import CommandInput from './CommandInput';

interface SimpleTerminalProps {
  output: OutputLine[];
  command: string;
  workdir: string;
  isExecuting: boolean;
  isMobile: boolean;
  containerName: string;
  outputRef: React.RefObject<HTMLDivElement | null>;
  onCommandChange: (value: string) => void;
  onExecute: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export default function SimpleTerminal({
  output,
  command,
  workdir,
  isExecuting,
  isMobile,
  containerName,
  outputRef,
  onCommandChange,
  onExecute,
  onKeyPress,
}: SimpleTerminalProps) {
  return (
    <>
      <TerminalOutput
        output={output}
        containerName={containerName}
        outputRef={outputRef}
      />
      <CommandInput
        command={command}
        workdir={workdir}
        isExecuting={isExecuting}
        isMobile={isMobile}
        containerName={containerName}
        onCommandChange={onCommandChange}
        onExecute={onExecute}
        onKeyPress={onKeyPress}
      />
    </>
  );
}
