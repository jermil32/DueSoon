export type AssetCategory =
  | 'car'
  | 'tractor'
  | 'atv'
  | 'lawnmower'
  | 'home'
  | 'boat';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  make?: string;
  model?: string;
  year?: number;
  imageUri?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type MaintenanceInterval =
  | { type: 'days'; value: number }
  | { type: 'months'; value: number }
  | { type: 'years'; value: number }
  | { type: 'miles'; value: number }
  | { type: 'hours'; value: number };

export interface MaintenanceTask {
  id: string;
  assetId: string;
  name: string;
  description?: string;
  interval: MaintenanceInterval;
  lastCompleted?: number;
  lastMileage?: number;
  lastHours?: number;
  nextDue?: number;
  nextDueMileage?: number;
  nextDueHours?: number;
  reminderDaysBefore: number;
  notificationId?: string;
  // Fluid change specific fields
  filterPartNumber?: string;
  fluidType?: string;
  fluidCapacity?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MaintenanceLog {
  id: string;
  taskId: string;
  assetId: string;
  completedAt: number;
  mileage?: number;
  hours?: number;
  cost?: number;
  notes?: string;
  createdAt: number;
}

export type IconOption =
  | 'car'
  | 'tractor'
  | 'atv'
  | 'lawnmower'
  | 'home'
  | 'boat'
  | 'airplane'
  | 'dollar'
  | 'garden'
  | 'tools'
  | 'bicycle'
  | 'motorcycle'
  | 'truck'
  | 'rv'
  | 'snowmobile'
  | 'generator'
  | 'livestock'
  | 'pets';

export interface AppSettings {
  notificationsEnabled: boolean;
  defaultReminderDays: number;
  reminderHour: number;
  reminderMinute: number;
  theme: 'light' | 'dark' | 'system';
  customCategoryLabels?: Record<AssetCategory, string>;
  customCategoryIcons?: Record<AssetCategory, IconOption>;
  onboardingCompleted?: boolean;
}
