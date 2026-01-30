import React from 'react';
import { OutputLine } from '@/lib/interfaces/terminal';

export const formatPrompt = (containerName: string, workdir: string): string => {
  let displayDir = workdir;
  if (workdir.length > 30) {
    const parts = workdir.split('/');
    displayDir = '.../' + parts[parts.length - 1];
  }
  return `root@${containerName}:${displayDir}#`;
};

export const highlightCommand = (line: OutputLine, containerName: string): React.ReactElement => {
  if (line.type === 'command') {
    const prompt = formatPrompt(containerName, line.workdir || '/');
    const parts = line.content.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1).join(' ');

    return (
      <div style={{ marginBottom: '4px' }}>
        <span style={{ color: '#8BE9FD', fontWeight: 'bold' }}>{prompt}</span>
        {' '}
        <span style={{ color: '#50FA7B', fontWeight: 'bold' }}>{cmd}</span>
        {args && <span style={{ color: '#F8F8F2' }}> {args}</span>}
      </div>
    );
  } else if (line.type === 'error') {
    return (
      <div style={{ color: '#FF5555', marginBottom: '2px' }}>
        {line.content}
      </div>
    );
  } else {
    return (
      <div style={{ color: '#F8F8F2', marginBottom: '2px', whiteSpace: 'pre-wrap' }}>
        {line.content}
      </div>
    );
  }
};
