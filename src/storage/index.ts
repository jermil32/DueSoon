import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset, MaintenanceTask, MaintenanceLog, AppSettings, AssetClass, InventoryItem, InventoryUsageLog } from '../types';
import { DEFAULT_ASSET_CLASSES } from '../utils/constants';

const KEYS = {
  ASSETS: '@duesoon_assets',
  TASKS: '@duesoon_tasks',
  LOGS: '@duesoon_logs',
  SETTINGS: '@duesoon_settings',
  INVENTORY: '@duesoon_inventory',
  INVENTORY_USAGE: '@duesoon_inventory_usage',
};

const defaultSettings: AppSettings = {
  notificationsEnabled: true,
  defaultReminderDays: 7,
  reminderHour: 9,
  reminderMinute: 0,
  theme: 'system',
  onboardingCompleted: false,
  assetClasses: DEFAULT_ASSET_CLASSES,
  completedTutorials: [],
  tutorialDismissedAll: false,
};

// Assets
export async function getAssets(): Promise<Asset[]> {
  const data = await AsyncStorage.getItem(KEYS.ASSETS);
  return data ? JSON.parse(data) : [];
}

export async function saveAssets(assets: Asset[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.ASSETS, JSON.stringify(assets));
}

export async function addAsset(asset: Asset): Promise<void> {
  const assets = await getAssets();
  assets.push(asset);
  await saveAssets(assets);
}

export async function updateAsset(asset: Asset): Promise<void> {
  const assets = await getAssets();
  const index = assets.findIndex((a) => a.id === asset.id);
  if (index !== -1) {
    assets[index] = { ...asset, updatedAt: Date.now() };
    await saveAssets(assets);
  }
}

export async function deleteAsset(assetId: string): Promise<void> {
  const assets = await getAssets();
  await saveAssets(assets.filter((a) => a.id !== assetId));
  // Also delete related tasks and logs
  const tasks = await getTasks();
  await saveTasks(tasks.filter((t) => t.assetId !== assetId));
  const logs = await getLogs();
  await saveLogs(logs.filter((l) => l.assetId !== assetId));
}

// Tasks
export async function getTasks(): Promise<MaintenanceTask[]> {
  const data = await AsyncStorage.getItem(KEYS.TASKS);
  return data ? JSON.parse(data) : [];
}

export async function saveTasks(tasks: MaintenanceTask[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
}

export async function getTasksForAsset(assetId: string): Promise<MaintenanceTask[]> {
  const tasks = await getTasks();
  return tasks.filter((t) => t.assetId === assetId);
}

export async function addTask(task: MaintenanceTask): Promise<void> {
  const tasks = await getTasks();
  tasks.push(task);
  await saveTasks(tasks);
}

export async function updateTask(task: MaintenanceTask): Promise<void> {
  const tasks = await getTasks();
  const index = tasks.findIndex((t) => t.id === task.id);
  if (index !== -1) {
    tasks[index] = { ...task, updatedAt: Date.now() };
    await saveTasks(tasks);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const tasks = await getTasks();
  await saveTasks(tasks.filter((t) => t.id !== taskId));
  // Also delete related logs
  const logs = await getLogs();
  await saveLogs(logs.filter((l) => l.taskId !== taskId));
}

// Logs
export async function getLogs(): Promise<MaintenanceLog[]> {
  const data = await AsyncStorage.getItem(KEYS.LOGS);
  return data ? JSON.parse(data) : [];
}

export async function saveLogs(logs: MaintenanceLog[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
}

export async function getLogsForTask(taskId: string): Promise<MaintenanceLog[]> {
  const logs = await getLogs();
  return logs.filter((l) => l.taskId === taskId).sort((a, b) => b.completedAt - a.completedAt);
}

export async function getLogsForAsset(assetId: string): Promise<MaintenanceLog[]> {
  const logs = await getLogs();
  return logs.filter((l) => l.assetId === assetId).sort((a, b) => b.completedAt - a.completedAt);
}

export async function addLog(log: MaintenanceLog): Promise<void> {
  const logs = await getLogs();
  logs.push(log);
  await saveLogs(logs);
}

export async function updateLog(log: MaintenanceLog): Promise<void> {
  const logs = await getLogs();
  const index = logs.findIndex((l) => l.id === log.id);
  if (index !== -1) {
    logs[index] = log;
    await saveLogs(logs);
  }
}

export async function getLogById(logId: string): Promise<MaintenanceLog | null> {
  const logs = await getLogs();
  return logs.find((l) => l.id === logId) || null;
}

// Settings
export async function getSettings(): Promise<AppSettings> {
  const data = await AsyncStorage.getItem(KEYS.SETTINGS);
  if (!data) return defaultSettings;

  const parsed = JSON.parse(data);
  const settings = { ...defaultSettings, ...parsed };

  // Migrate from old customCategoryLabels/customCategoryIcons to assetClasses
  if (!settings.assetClasses && (settings.customCategoryLabels || settings.customCategoryIcons)) {
    settings.assetClasses = DEFAULT_ASSET_CLASSES.map(ac => ({
      ...ac,
      label: settings.customCategoryLabels?.[ac.id] || ac.label,
      icon: settings.customCategoryIcons?.[ac.id] || ac.icon,
    }));
  }

  // Ensure assetClasses exists
  if (!settings.assetClasses) {
    settings.assetClasses = DEFAULT_ASSET_CLASSES;
  }

  return settings;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

// Asset Classes
export async function getAssetClasses(): Promise<AssetClass[]> {
  const settings = await getSettings();
  return settings.assetClasses || DEFAULT_ASSET_CLASSES;
}

export async function saveAssetClasses(assetClasses: AssetClass[]): Promise<void> {
  const settings = await getSettings();
  settings.assetClasses = assetClasses;
  await saveSettings(settings);
}

export async function addAssetClass(assetClass: AssetClass): Promise<void> {
  const classes = await getAssetClasses();
  classes.push(assetClass);
  await saveAssetClasses(classes);
}

export async function updateAssetClass(assetClass: AssetClass): Promise<void> {
  const classes = await getAssetClasses();
  const index = classes.findIndex(c => c.id === assetClass.id);
  if (index !== -1) {
    classes[index] = assetClass;
    await saveAssetClasses(classes);
  }
}

export async function deleteAssetClass(classId: string): Promise<void> {
  const classes = await getAssetClasses();
  await saveAssetClasses(classes.filter(c => c.id !== classId));
}

export async function reorderAssetClasses(classIds: string[]): Promise<void> {
  const classes = await getAssetClasses();
  const reordered = classIds.map((id, index) => {
    const cls = classes.find(c => c.id === id);
    if (cls) {
      return { ...cls, order: index };
    }
    return null;
  }).filter((c): c is AssetClass => c !== null);
  await saveAssetClasses(reordered);
}

// Inventory
export async function getInventory(): Promise<InventoryItem[]> {
  const data = await AsyncStorage.getItem(KEYS.INVENTORY);
  return data ? JSON.parse(data) : [];
}

export async function saveInventory(items: InventoryItem[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.INVENTORY, JSON.stringify(items));
}

export async function getInventoryItem(itemId: string): Promise<InventoryItem | null> {
  const items = await getInventory();
  return items.find((i) => i.id === itemId) || null;
}

export async function addInventoryItem(item: InventoryItem): Promise<void> {
  const items = await getInventory();
  items.push(item);
  await saveInventory(items);
}

export async function updateInventoryItem(item: InventoryItem): Promise<void> {
  const items = await getInventory();
  const index = items.findIndex((i) => i.id === item.id);
  if (index !== -1) {
    items[index] = { ...item, updatedAt: Date.now() };
    await saveInventory(items);
  }
}

export async function deleteInventoryItem(itemId: string): Promise<void> {
  const items = await getInventory();
  await saveInventory(items.filter((i) => i.id !== itemId));
  // Also delete related usage logs
  const usageLogs = await getInventoryUsageLogs();
  await saveInventoryUsageLogs(usageLogs.filter((l) => l.inventoryItemId !== itemId));
}

export async function getInventoryForAsset(assetId: string): Promise<InventoryItem[]> {
  const items = await getInventory();
  return items.filter((i) => i.linkedAssetIds?.includes(assetId));
}

export async function getInventoryForTask(taskId: string): Promise<InventoryItem[]> {
  const items = await getInventory();
  return items.filter((i) => i.linkedTaskIds?.includes(taskId));
}

export async function updateInventoryQuantity(itemId: string, quantityChange: number): Promise<void> {
  const items = await getInventory();
  const index = items.findIndex((i) => i.id === itemId);
  if (index !== -1) {
    items[index].quantity = Math.max(0, items[index].quantity + quantityChange);
    items[index].updatedAt = Date.now();
    await saveInventory(items);
  }
}

// Inventory Usage Logs
export async function getInventoryUsageLogs(): Promise<InventoryUsageLog[]> {
  const data = await AsyncStorage.getItem(KEYS.INVENTORY_USAGE);
  return data ? JSON.parse(data) : [];
}

export async function saveInventoryUsageLogs(logs: InventoryUsageLog[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.INVENTORY_USAGE, JSON.stringify(logs));
}

export async function addInventoryUsageLog(log: InventoryUsageLog): Promise<void> {
  const logs = await getInventoryUsageLogs();
  logs.push(log);
  await saveInventoryUsageLogs(logs);
}

export async function getUsageLogsForInventoryItem(itemId: string): Promise<InventoryUsageLog[]> {
  const logs = await getInventoryUsageLogs();
  return logs.filter((l) => l.inventoryItemId === itemId).sort((a, b) => b.usedAt - a.usedAt);
}

export async function getUsageLogsForMaintenanceLog(maintenanceLogId: string): Promise<InventoryUsageLog[]> {
  const logs = await getInventoryUsageLogs();
  return logs.filter((l) => l.maintenanceLogId === maintenanceLogId);
}

// Clear all data (for development/testing)
export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.ASSETS, KEYS.TASKS, KEYS.LOGS, KEYS.SETTINGS, KEYS.INVENTORY, KEYS.INVENTORY_USAGE]);
}
