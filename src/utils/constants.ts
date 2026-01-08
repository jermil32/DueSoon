import { AssetCategory } from '../types';

export const COLORS = {
  primary: '#FF6B35',
  primaryLight: '#FF8F66',
  primaryDark: '#E55A2B',
  secondary: '#004E89',
  secondaryLight: '#1A6AA8',
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
  car: 'Car',
  tractor: 'Tractor',
  atv: 'ATV',
  lawnmower: 'Mower',
  home: 'Home',
  boat: 'Boat',
};

export const ASSET_CATEGORIES: AssetCategory[] = [
  'car',
  'tractor',
  'atv',
  'lawnmower',
  'home',
  'boat',
];

export const DEFAULT_MAINTENANCE_TEMPLATES: Record<
  AssetCategory,
  Array<{ name: string; intervalType: string; intervalValue: number; reminderDays: number }>
> = {
  car: [
    { name: 'Oil Change', intervalType: 'miles', intervalValue: 5000, reminderDays: 7 },
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
