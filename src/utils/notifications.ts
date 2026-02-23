import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { MaintenanceTask, Asset, InventoryItem } from '../types';

// Notification action identifiers
export const NOTIFICATION_ACTIONS = {
  REMIND_TOMORROW: 'REMIND_TOMORROW',
  REMIND_3_DAYS: 'REMIND_3_DAYS',
  REMIND_1_WEEK: 'REMIND_1_WEEK',
  GOT_IT: 'GOT_IT',
};

// Notification category identifiers
export const MAINTENANCE_CATEGORY = 'MAINTENANCE_REMINDER';
export const INVENTORY_CATEGORY = 'INVENTORY_LOW_STOCK';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Set up notification categories with action buttons
export async function setupNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(MAINTENANCE_CATEGORY, [
    {
      identifier: NOTIFICATION_ACTIONS.REMIND_TOMORROW,
      buttonTitle: 'Remind Tomorrow',
      options: {
        opensAppToForeground: false,
      },
    },
    {
      identifier: NOTIFICATION_ACTIONS.REMIND_3_DAYS,
      buttonTitle: 'Remind in 3 Days',
      options: {
        opensAppToForeground: false,
      },
    },
    {
      identifier: NOTIFICATION_ACTIONS.REMIND_1_WEEK,
      buttonTitle: 'Remind in 1 Week',
      options: {
        opensAppToForeground: false,
      },
    },
    {
      identifier: NOTIFICATION_ACTIONS.GOT_IT,
      buttonTitle: 'Got It',
      options: {
        opensAppToForeground: false,
      },
    },
  ]);
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Notifications only work on physical devices');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('maintenance', {
      name: 'Maintenance Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B35',
    });
  }

  return true;
}

export async function scheduleTaskNotification(
  task: MaintenanceTask,
  asset: Asset,
  reminderHour: number = 9,
  reminderMinute: number = 0
): Promise<string | null> {
  if (!task.nextDue) return null;

  try {
    // Cancel existing notification for this task
    if (task.notificationId) {
      await cancelNotification(task.notificationId);
    }

    // Calculate notification date (reminderDaysBefore days before due)
    // Use millisecond math to avoid month boundary issues with setDate()
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const reminderOffset = task.reminderDaysBefore * millisecondsPerDay;
    const notificationDate = new Date(task.nextDue - reminderOffset);
    notificationDate.setHours(reminderHour, reminderMinute, 0, 0);

    // Don't schedule if the notification date is in the past
    if (notificationDate.getTime() <= Date.now()) {
      return null;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Maintenance Due Soon',
        body: `${task.name} for ${asset.name} is due in ${task.reminderDaysBefore} days`,
        data: { taskId: task.id, assetId: asset.id, assetName: asset.name, taskName: task.name },
        sound: true,
        categoryIdentifier: MAINTENANCE_CATEGORY,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notificationDate,
      },
    });

    return identifier;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return null;
  }
}

// Schedule a snooze reminder for a specific number of days from now
export async function scheduleSnoozeNotification(
  taskId: string,
  assetId: string,
  taskName: string,
  assetName: string,
  snoozeDays: number,
  reminderHour: number = 9,
  reminderMinute: number = 0
): Promise<string> {
  const snoozeDate = new Date();
  snoozeDate.setDate(snoozeDate.getDate() + snoozeDays);
  snoozeDate.setHours(reminderHour, reminderMinute, 0, 0);

  // If snooze time is in the past, set it for tomorrow
  if (snoozeDate.getTime() <= Date.now()) {
    snoozeDate.setDate(snoozeDate.getDate() + 1);
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Maintenance Reminder',
      body: `${taskName} for ${assetName} needs attention`,
      data: { taskId, assetId, assetName, taskName },
      sound: true,
      categoryIdentifier: MAINTENANCE_CATEGORY,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: snoozeDate,
    },
  });

  return identifier;
}

export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Send immediate notification for low stock inventory
export async function sendLowStockNotification(item: InventoryItem): Promise<string | null> {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Low Stock Alert',
        body: `${item.name} is running low (${item.quantity} ${item.unit} remaining)`,
        data: { itemId: item.id, type: 'low_stock' },
        sound: true,
      },
      trigger: null, // Send immediately
    });

    return identifier;
  } catch (error) {
    console.error('Failed to send low stock notification:', error);
    return null;
  }
}

// Check if item is below reorder threshold
export function isLowStock(item: InventoryItem): boolean {
  if (item.reorderThreshold === undefined || item.reorderThreshold === null) {
    return false;
  }
  return item.quantity <= item.reorderThreshold;
}
