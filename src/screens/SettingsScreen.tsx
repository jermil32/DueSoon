import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MainTabScreenProps } from '../navigation/types';
import { AppSettings } from '../types';
import { getSettings, saveSettings, clearAllData, getAssets, getTasks, getLogs } from '../storage';
import { requestNotificationPermissions, cancelAllNotifications, MAINTENANCE_CATEGORY } from '../utils/notifications';
import { SPACING, FONT_SIZE } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

type Props = MainTabScreenProps<'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { colors, themeMode, setThemeMode, isDark } = useTheme();
  const [settings, setSettings] = useState<AppSettings>({
    notificationsEnabled: true,
    defaultReminderDays: 7,
    reminderHour: 9,
    reminderMinute: 0,
    theme: 'system',
  });
  const [stats, setStats] = useState({ assets: 0, tasks: 0, logs: 0 });
  const [showTimePicker, setShowTimePicker] = useState(false);

  const loadData = useCallback(async () => {
    const [loadedSettings, assets, tasks, logs] = await Promise.all([
      getSettings(),
      getAssets(),
      getTasks(),
      getLogs(),
    ]);
    setSettings(loadedSettings);
    setStats({
      assets: assets.length,
      tasks: tasks.length,
      logs: logs.length,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleNotificationsToggle = async (enabled: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (enabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive maintenance reminders.'
        );
        return;
      }
    } else {
      await cancelAllNotifications();
    }

    const newSettings = { ...settings, notificationsEnabled: enabled };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setThemeMode(theme);
  };

  const handleClearData = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your assets, maintenance tasks, and history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            await cancelAllNotifications();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Done', 'All data has been cleared.');
            loadData();
          },
        },
      ]
    );
  };

  const handleTestNotification = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!settings.notificationsEnabled) {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications first to test them.'
      );
      return;
    }

    // Schedule a test notification in 5 seconds
    const testDate = new Date(Date.now() + 5000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test: Maintenance Due Soon',
        body: 'Oil Change for Test Vehicle is due in 3 days',
        data: {
          taskId: 'test-task',
          assetId: 'test-asset',
          taskName: 'Oil Change',
          assetName: 'Test Vehicle',
        },
        sound: true,
        categoryIdentifier: MAINTENANCE_CATEGORY,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: testDate,
      },
    });

    Alert.alert(
      'Test Notification Scheduled',
      'A test notification will appear in 5 seconds. Try the snooze options when it arrives!'
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    section: {
      backgroundColor: colors.surface,
      marginTop: SPACING.md,
      padding: SPACING.md,
    },
    sectionTitle: {
      fontSize: FONT_SIZE.sm,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: SPACING.md,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    settingInfo: {
      flex: 1,
      marginRight: SPACING.md,
    },
    settingLabel: {
      fontSize: FONT_SIZE.lg,
      color: colors.text,
      fontWeight: '500',
    },
    settingDescription: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    themeButtons: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    themeButton: {
      flex: 1,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
    },
    themeButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
    },
    themeButtonText: {
      fontSize: FONT_SIZE.sm,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    themeButtonTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: FONT_SIZE.xxl,
      fontWeight: '700',
      color: colors.primary,
    },
    statLabel: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    testButton: {
      backgroundColor: colors.primary,
      padding: SPACING.md,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: SPACING.sm,
    },
    testButtonText: {
      color: '#FFFFFF',
      fontSize: FONT_SIZE.lg,
      fontWeight: '600',
    },
    dangerButton: {
      backgroundColor: colors.danger,
      padding: SPACING.md,
      borderRadius: 8,
      alignItems: 'center',
    },
    dangerButtonText: {
      color: '#FFFFFF',
      fontSize: FONT_SIZE.lg,
      fontWeight: '600',
    },
    aboutInfo: {
      alignItems: 'center',
    },
    appNameContainer: {
      flexDirection: 'row',
    },
    appNameDue: {
      fontSize: FONT_SIZE.xxl,
      fontWeight: '700',
      color: colors.secondary,
    },
    appNameSoon: {
      fontSize: FONT_SIZE.xxl,
      fontWeight: '700',
      color: colors.primary,
    },
    appVersion: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      marginTop: SPACING.xs,
    },
    appDescription: {
      fontSize: FONT_SIZE.md,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: SPACING.sm,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Theme</Text>
            <Text style={styles.settingDescription}>
              Choose your preferred appearance
            </Text>
          </View>
        </View>
        <View style={styles.themeButtons}>
          <TouchableOpacity
            style={[styles.themeButton, themeMode === 'light' && styles.themeButtonActive]}
            onPress={() => handleThemeChange('light')}
          >
            <Text style={[styles.themeButtonText, themeMode === 'light' && styles.themeButtonTextActive]}>
              Light
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.themeButton, themeMode === 'dark' && styles.themeButtonActive]}
            onPress={() => handleThemeChange('dark')}
          >
            <Text style={[styles.themeButtonText, themeMode === 'dark' && styles.themeButtonTextActive]}>
              Dark
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.themeButton, themeMode === 'system' && styles.themeButtonActive]}
            onPress={() => handleThemeChange('system')}
          >
            <Text style={[styles.themeButtonText, themeMode === 'system' && styles.themeButtonTextActive]}>
              System
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive reminders when maintenance is due
            </Text>
          </View>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={handleNotificationsToggle}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={settings.notificationsEnabled ? colors.primary : colors.textLight}
          />
        </View>
        <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
          <Text style={styles.testButtonText}>Test Notification</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.assets}</Text>
            <Text style={styles.statLabel}>Assets</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.tasks}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.logs}</Text>
            <Text style={styles.statLabel}>Logs</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
          <Text style={styles.dangerButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutInfo}>
          <View style={styles.appNameContainer}>
            <Text style={styles.appNameDue}>Due</Text>
            <Text style={styles.appNameSoon}>Soon</Text>
          </View>
          <Text style={styles.appVersion}>Version {APP_VERSION}</Text>
          <Text style={styles.appDescription}>
            Track maintenance schedules for your vehicles, equipment, and property.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
