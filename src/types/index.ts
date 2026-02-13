// Mission Control Dashboard - TypeScript Types

export type StatusType = 'online' | 'warning' | 'error' | 'offline';

export type BadgeStatus = 'success' | 'warning' | 'error' | 'info';

export interface Badge {
  count?: number;
  status?: BadgeStatus;
  text?: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  url: string;
  badge?: Badge;
  subItems?: NavItem[];
  external?: boolean;
}

export interface QuickStat {
  value: number | string;
  label: string;
}

export interface PrimaryMetric {
  value: number | string;
  label: string;
}

export interface AppCardData {
  id: string;
  name: string;
  icon: string;
  status: StatusType;
  primaryMetric: PrimaryMetric;
  quickStats: QuickStat[];
  actionLabel?: string;
  onAction?: () => void;
  onViewDetails?: () => void;
}

export interface LiveStat {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  percentage?: number;
  status: 'excellent' | 'normal' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

export interface ActivityItem {
  id: string;
  icon: string;
  title: string;
  description?: string;
  timestamp: string;
  unread?: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
}
