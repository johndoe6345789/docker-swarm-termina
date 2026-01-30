export interface DashboardHeaderProps {
  containerCount: number;
  isMobile: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}
