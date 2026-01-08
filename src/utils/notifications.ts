import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { MaintenanceTask, Asset } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
  asset: Asset
): Promise<string | null> {
  if (!task.nextDue) return null;

  // Cancel existing notification for this task
  if (task.notificationId) {
    await cancelNotification(task.notificationId);
  }

  // Calculate notification date (reminderDaysBefore days before due)
  const notificationDate = new Date(task.nextDue);
  notificationDate.setDate(notificationDate.getDate() - task.reminderDaysBefore);
  notificationDate.setHours(9, 0, 0, 0); // 9 AM

  // Don't schedule if the notification date is in the past
  if (notificationDate.getTime() <= Date.now()) {
    return null;
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Maintenance Due Soon',
      body: `${task.name} for ${asset.name} is due in ${task.reminderDaysBefore} days`,
      data: { taskId: task.id, assetId: asset.id },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: notificationDate,
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
