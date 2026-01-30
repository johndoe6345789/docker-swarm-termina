import { Container } from '@/lib/api';

export interface ContainerCardProps {
  container: Container;
  onOpenShell: () => void;
  onContainerUpdate?: () => void;
}

export interface ContainerHeaderProps {
  name: string;
  image: string;
  status: string;
}

export interface ContainerInfoProps {
  id: string;
  uptime: string;
}

export interface ContainerActionsProps {
  status: string;
  isLoading: boolean;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onRemove: () => void;
  onOpenShell: () => void;
}

export interface DeleteConfirmDialogProps {
  open: boolean;
  containerName: string;
  onClose: () => void;
  onConfirm: () => void;
}
