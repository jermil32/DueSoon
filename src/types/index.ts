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

// AssetCategory is now a string ID that references an AssetClass
export type AssetCategory = string;

// Built-in category IDs for backwards compatibility
export type BuiltInCategory =
  | 'car'
  | 'tractor'
  | 'atv'
  | 'lawnmower'
  | 'home'
  | 'boat';

export interface AssetClass {
  id: string;
  label: string;
  icon: IconOption;
  isBuiltIn: boolean; // true for the 6 default categories
  order: number; // for sorting/display order
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  make?: string;
  model?: string;
  year?: number;
  imageUri?: string;
  notes?: string;
  // Pet-specific fields
  species?: string;
  breed?: string;
  dateOfBirth?: number; // timestamp
  weight?: string;
  veterinarian?: string;
  microchipNumber?: string;
  // Home-specific fields
  address?: string;
  squareFootage?: string;
  // Money/Bills-specific fields
  accountNumber?: string;
  provider?: string;
  dueDay?: number; // day of month
  // Garden-specific fields
  plotSize?: string;
  soilType?: string;
  createdAt: number;
  updatedAt: number;
}

// Inventory item for tracking maintenance supplies
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string; // e.g., 'quarts', 'filters', 'each'
  partNumber?: string;
  brand?: string;
  notes?: string;
  // Link to specific assets or tasks this item is used for
  linkedAssetIds?: string[];
  linkedTaskIds?: string[];
  // Reorder alerts
  reorderThreshold?: number;
  // Amazon affiliate link for quick purchasing
  amazonUrl?: string;
  // Asset categories this item applies to (e.g., ['car', 'tractor', 'atv'])
  applicableCategories?: string[];
  createdAt: number;
  updatedAt: number;
}

// Record of inventory usage
export interface InventoryUsageLog {
  id: string;
  inventoryItemId: string;
  maintenanceLogId?: string; // link to the maintenance log that used this
  quantityUsed: number;
  usedAt: number;
  notes?: string;
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

// Tutorial step IDs
export type TutorialStepId =
  | 'home_category_tap'
  | 'home_category_longpress'
  | 'category_add_asset'
  | 'assets_edit_button'
  | 'assets_reorder'
  | 'assets_separator'
  | 'asset_detail_add_task'
  | 'inventory_add';

export interface AppSettings {
  notificationsEnabled: boolean;
  defaultReminderDays: number;
  reminderHour: number;
  reminderMinute: number;
  theme: 'light' | 'dark' | 'system';
  assetClasses?: AssetClass[];
  // Legacy fields for backwards compatibility
  customCategoryLabels?: Record<AssetCategory, string>;
  customCategoryIcons?: Record<AssetCategory, IconOption>;
  onboardingCompleted?: boolean;
  // Tutorial system
  completedTutorials?: TutorialStepId[];
  tutorialDismissedAll?: boolean;
}
