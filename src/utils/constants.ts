import { AssetCategory, IconOption } from '../types';

export type ColorScheme = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textLight: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  overdue: string;
  dueSoon: string;
  upcoming: string;
};

export const LIGHT_COLORS: ColorScheme = {
  primary: '#FE7E02',
  primaryLight: '#FFA040',
  primaryDark: '#E06C00',
  secondary: '#2F3F48',
  secondaryLight: '#4A5D68',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#212529',
  textSecondary: '#6C757D',
  textLight: '#ADB5BD',
  border: '#DEE2E6',
  success: '#28A745',
  warning: '#FFC107',
  danger: '#DC3545',
  overdue: '#DC3545',
  dueSoon: '#FFC107',
  upcoming: '#28A745',
};

export const DARK_COLORS: ColorScheme = {
  primary: '#FE7E02',
  primaryLight: '#FFA040',
  primaryDark: '#E06C00',
  secondary: '#E8EAED',
  secondaryLight: '#9AA0A6',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#E8EAED',
  textSecondary: '#9AA0A6',
  textLight: '#5F6368',
  border: '#3C4043',
  success: '#34A853',
  warning: '#FBBC04',
  danger: '#EA4335',
  overdue: '#EA4335',
  dueSoon: '#FBBC04',
  upcoming: '#34A853',
};

// Default to light colors for backwards compatibility
export const COLORS = LIGHT_COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const FONT_SIZE = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  title: 32,
};

export const CATEGORY_LABELS: Record<AssetCategory, string> = {
  car: 'Vehicles',
  tractor: 'Tractors',
  atv: 'Power Sports',
  lawnmower: 'Equipment',
  home: 'Homes',
  boat: 'Watercraft',
};

export const ASSET_CATEGORIES: AssetCategory[] = [
  'car',
  'tractor',
  'atv',
  'lawnmower',
  'home',
  'boat',
];

export const DEFAULT_CATEGORY_ICONS: Record<AssetCategory, IconOption> = {
  car: 'car',
  tractor: 'tractor',
  atv: 'atv',
  lawnmower: 'lawnmower',
  home: 'home',
  boat: 'boat',
};

export const ICON_OPTIONS: Array<{ id: IconOption; label: string }> = [
  { id: 'car', label: 'Car' },
  { id: 'truck', label: 'Truck' },
  { id: 'motorcycle', label: 'Motorcycle' },
  { id: 'tractor', label: 'Tractor' },
  { id: 'atv', label: 'ATV' },
  { id: 'lawnmower', label: 'Mower' },
  { id: 'boat', label: 'Boat' },
  { id: 'home', label: 'Home' },
  { id: 'airplane', label: 'Airplane' },
  { id: 'dollar', label: 'Bills' },
  { id: 'garden', label: 'Garden' },
  { id: 'tools', label: 'Tools' },
  { id: 'bicycle', label: 'Bicycle' },
  { id: 'rv', label: 'RV' },
  { id: 'snowmobile', label: 'Sled' },
  { id: 'generator', label: 'Appliance' },
  { id: 'livestock', label: 'Livestock' },
  { id: 'pets', label: 'Pets' },
];

export const DEFAULT_MAINTENANCE_TEMPLATES: Record<
  AssetCategory,
  Array<{ name: string; intervalType: string; intervalValue: number; reminderDays: number }>
> = {
  car: [
    { name: 'Oil Change', intervalType: 'miles', intervalValue: 5000, reminderDays: 7 },
    { name: 'Transmission Fluid Change', intervalType: 'miles', intervalValue: 50000, reminderDays: 14 },
    { name: 'Tire Rotation', intervalType: 'miles', intervalValue: 7500, reminderDays: 7 },
    { name: 'Air Filter', intervalType: 'miles', intervalValue: 15000, reminderDays: 14 },
    { name: 'Brake Inspection', intervalType: 'miles', intervalValue: 20000, reminderDays: 14 },
    { name: 'Registration Renewal', intervalType: 'years', intervalValue: 1, reminderDays: 30 },
  ],
  tractor: [
    { name: 'Oil Change', intervalType: 'hours', intervalValue: 100, reminderDays: 7 },
    { name: 'Air Filter', intervalType: 'hours', intervalValue: 200, reminderDays: 14 },
    { name: 'Hydraulic Fluid', intervalType: 'hours', intervalValue: 500, reminderDays: 14 },
    { name: 'Grease Fittings', intervalType: 'hours', intervalValue: 50, reminderDays: 7 },
  ],
  atv: [
    { name: 'Oil Change', intervalType: 'hours', intervalValue: 50, reminderDays: 7 },
    { name: 'Air Filter', intervalType: 'hours', intervalValue: 100, reminderDays: 7 },
    { name: 'Spark Plug', intervalType: 'hours', intervalValue: 200, reminderDays: 14 },
    { name: 'Coolant Flush', intervalType: 'years', intervalValue: 2, reminderDays: 30 },
  ],
  lawnmower: [
    { name: 'Oil Change', intervalType: 'hours', intervalValue: 50, reminderDays: 7 },
    { name: 'Air Filter', intervalType: 'hours', intervalValue: 100, reminderDays: 7 },
    { name: 'Spark Plug', intervalType: 'years', intervalValue: 1, reminderDays: 14 },
    { name: 'Blade Sharpening', intervalType: 'hours', intervalValue: 25, reminderDays: 7 },
  ],
  home: [
    { name: 'HVAC Filter', intervalType: 'months', intervalValue: 3, reminderDays: 7 },
    { name: 'Propane Fill', intervalType: 'months', intervalValue: 3, reminderDays: 14 },
    { name: 'Smoke Detector Batteries', intervalType: 'years', intervalValue: 1, reminderDays: 14 },
    { name: 'Gutter Cleaning', intervalType: 'months', intervalValue: 6, reminderDays: 14 },
    { name: 'Water Heater Flush', intervalType: 'years', intervalValue: 1, reminderDays: 30 },
    { name: 'HVAC Service', intervalType: 'years', intervalValue: 1, reminderDays: 30 },
  ],
  boat: [
    { name: 'Oil Change', intervalType: 'hours', intervalValue: 100, reminderDays: 7 },
    { name: 'Lower Unit Service', intervalType: 'years', intervalValue: 1, reminderDays: 30 },
    { name: 'Impeller Replacement', intervalType: 'years', intervalValue: 2, reminderDays: 30 },
    { name: 'Winterization', intervalType: 'years', intervalValue: 1, reminderDays: 30 },
    { name: 'Registration Renewal', intervalType: 'years', intervalValue: 1, reminderDays: 30 },
  ],
};
