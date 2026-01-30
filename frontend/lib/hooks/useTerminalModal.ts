import { useState } from 'react';
import { Container } from '@/lib/api';

export function useTerminalModal() {
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  const openTerminal = (container: Container) => {
    setSelectedContainer(container);
    setIsTerminalOpen(true);
  };

  const closeTerminal = () => {
    setIsTerminalOpen(false);
    setTimeout(() => setSelectedContainer(null), 300);
  };

  return {
    selectedContainer,
    isTerminalOpen,
    openTerminal,
    closeTerminal,
  };
}
