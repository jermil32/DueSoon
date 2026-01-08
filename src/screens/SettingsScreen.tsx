import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MainTabScreenProps } from '../navigation/types';
import { AppSettings } from '../types';
import { getSettings, saveSettings, clearAllData, getAssets, getTasks, getLogs } from '../storage';
import { requestNotificationPermissions, cancelAllNotifications } from '../utils/notifications';
import { COLORS, SPACING, FONT_SIZE } from '../utils/constants';

type Props = MainTabScreenProps<'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const [settings, setSettings] = useState<AppSettings>({
    notificationsEnabled: true,
    defaultReminderDays: 7,
    theme: 'system',
  });
  const [stats, setStats] = useState({ assets: 0, tasks: 0, logs: 0 });

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

  const handleClearData = () => {
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
            Alert.alert('Done', 'All data has been cleared.');
            loadData();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
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
            trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
            thumbColor={settings.notificationsEnabled ? COLORS.primary : COLORS.textLight}
          />
        </View>
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
          <Text style={styles.appName}>DueSoon</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            Track maintenance schedules for your vehicles, equipment, and property.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    backgroundColor: COLORS.surface,
    marginTop: SPACING.md,
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingLabel: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
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
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dangerButton: {
    backgroundColor: COLORS.danger,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  aboutInfo: {
    alignItems: 'center',
  },
  appName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  appVersion: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  appDescription: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
