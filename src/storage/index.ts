import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset, MaintenanceTask, MaintenanceLog, AppSettings } from '../types';

const KEYS = {
  ASSETS: '@duesoon_assets',
  TASKS: '@duesoon_tasks',
  LOGS: '@duesoon_logs',
  SETTINGS: '@duesoon_settings',
};

const defaultSettings: AppSettings = {
  notificationsEnabled: true,
  defaultReminderDays: 7,
  theme: 'system',
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

export async function addLog(log: MaintenanceLog): Promise<void> {
  const logs = await getLogs();
  logs.push(log);
  await saveLogs(logs);
}

// Settings
export async function getSettings(): Promise<AppSettings> {
  const data = await AsyncStorage.getItem(KEYS.SETTINGS);
  return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

// Clear all data (for development/testing)
export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.ASSETS, KEYS.TASKS, KEYS.LOGS, KEYS.SETTINGS]);
}
