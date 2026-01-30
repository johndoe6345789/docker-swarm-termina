import React from 'react';
import { SimpleTerminalProps } from '@/lib/interfaces/terminal';
import TerminalOutput from './TerminalOutput';
import CommandInput from './CommandInput';

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
