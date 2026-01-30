export interface OutputLine {
  type: 'command' | 'output' | 'error';
  content: string;
  workdir?: string;
}

export interface TerminalModalProps {
  open: boolean;
  onClose: () => void;
  containerName: string;
  containerId: string;
}

export interface TerminalHeaderProps {
  containerName: string;
  mode: 'simple' | 'interactive';
  interactiveFailed: boolean;
  onModeChange: (event: React.MouseEvent<HTMLElement>, newMode: 'simple' | 'interactive' | null) => void;
  onClose: () => void;
}

export interface InteractiveTerminalProps {
  terminalRef: React.RefObject<HTMLDivElement | null>;
}

export interface SimpleTerminalProps {
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

export interface TerminalOutputProps {
  output: OutputLine[];
  containerName: string;
  outputRef: React.RefObject<HTMLDivElement | null>;
}

export interface CommandInputProps {
  command: string;
  workdir: string;
  isExecuting: boolean;
  isMobile: boolean;
  containerName: string;
  onCommandChange: (value: string) => void;
  onExecute: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export interface FallbackNotificationProps {
  show: boolean;
  reason: string;
  onClose: () => void;
  onRetry: () => void;
}
