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
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MainTabScreenProps } from '../navigation/types';
import { AppSettings } from '../types';
import { getSettings, saveSettings, clearAllData, getAssets, getTasks, getLogs } from '../storage';
import { requestNotificationPermissions, cancelAllNotifications } from '../utils/notifications';
import { SPACING, FONT_SIZE } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';
import { usePremium, FREE_ASSET_LIMIT } from '../context/PremiumContext';
import { useTutorial } from '../context/TutorialContext';

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

type Props = MainTabScreenProps<'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { colors, themeMode, setThemeMode, isDark } = useTheme();
  const { isPremium } = usePremium();
  const { resetTutorials, dismissedAll, completedTutorials } = useTutorial();
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

    // Dark mode requires premium
    if ((theme === 'dark' || theme === 'system') && !isPremium) {
      navigation.navigate('Upgrade', { feature: 'Dark Mode' });
      return;
    }

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

  const handleResetTutorials = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await resetTutorials();
    Alert.alert('Done', 'Tutorial tips have been reset. You will see helpful tips as you navigate the app.');
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
    inventoryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: SPACING.md,
      borderRadius: 8,
    },
    inventoryButtonContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    inventoryButtonInfo: {
      marginLeft: SPACING.md,
      flex: 1,
    },
    inventoryButtonText: {
      fontSize: FONT_SIZE.lg,
      fontWeight: '600',
      color: colors.text,
    },
    inventoryButtonDescription: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    inventoryBadge: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: 12,
      marginRight: SPACING.sm,
    },
    inventoryBadgeText: {
      fontSize: FONT_SIZE.sm,
      fontWeight: '600',
      color: colors.primary,
    },
    resetTutorialButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.md,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: SPACING.md,
    },
    resetTutorialText: {
      fontSize: FONT_SIZE.md,
      fontWeight: '500',
    },
    resetTutorialSubtext: {
      fontSize: FONT_SIZE.sm,
      marginTop: 2,
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
    premiumInfo: {
      marginBottom: SPACING.md,
    },
    premiumTitle: {
      fontSize: FONT_SIZE.xl,
      fontWeight: '700',
      color: colors.text,
      marginBottom: SPACING.xs,
    },
    premiumDescription: {
      fontSize: FONT_SIZE.md,
      color: colors.textSecondary,
      marginBottom: SPACING.sm,
    },
    premiumLimit: {
      fontSize: FONT_SIZE.sm,
      color: colors.primary,
      fontWeight: '500',
    },
    upgradeButton: {
      backgroundColor: colors.primary,
      padding: SPACING.md,
      borderRadius: 8,
      alignItems: 'center',
    },
    upgradeButtonText: {
      color: '#FFFFFF',
      fontSize: FONT_SIZE.lg,
      fontWeight: '700',
    },
    premiumActiveContainer: {
      alignItems: 'center',
      padding: SPACING.md,
    },
    premiumActiveIcon: {
      fontSize: 32,
      marginBottom: SPACING.sm,
    },
    premiumActiveText: {
      fontSize: FONT_SIZE.lg,
      fontWeight: '600',
      color: colors.primary,
    },
    premiumActiveSubtext: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      marginTop: SPACING.xs,
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
      marginBottom: SPACING.md,
    },
    aboutLink: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    aboutLinkText: {
      flex: 1,
      fontSize: FONT_SIZE.md,
      fontWeight: '500' as const,
      marginLeft: SPACING.md,
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
              Dark {!isPremium && '🔒'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.themeButton, themeMode === 'system' && styles.themeButtonActive]}
            onPress={() => handleThemeChange('system')}
          >
            <Text style={[styles.themeButtonText, themeMode === 'system' && styles.themeButtonTextActive]}>
              Auto {!isPremium && '🔒'}
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
        <TouchableOpacity
          style={[styles.resetTutorialButton, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={handleResetTutorials}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.primary} style={{ marginRight: SPACING.sm }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.resetTutorialText, { color: colors.text }]}>Reset Tutorial Tips</Text>
            <Text style={[styles.resetTutorialSubtext, { color: colors.textSecondary }]}>
              {dismissedAll || completedTutorials.length > 0
                ? 'Show helpful tips again'
                : 'All tips are enabled'}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
          <Text style={styles.dangerButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {!isPremium && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium</Text>
          <View style={styles.premiumInfo}>
            <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
            <Text style={styles.premiumDescription}>
              Unlock unlimited assets, PDF export, dark mode, and more.
            </Text>
            <Text style={styles.premiumLimit}>
              Free: {FREE_ASSET_LIMIT} assets • You have {stats.assets}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('Upgrade')}
          >
            <Text style={styles.upgradeButtonText}>Unlock Premium - $9.99</Text>
          </TouchableOpacity>
        </View>
      )}

      {isPremium && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium</Text>
          <View style={styles.premiumActiveContainer}>
            <Text style={styles.premiumActiveIcon}>⭐</Text>
            <Text style={styles.premiumActiveText}>Premium Active</Text>
            <Text style={styles.premiumActiveSubtext}>Thank you for your support!</Text>
          </View>
        </View>
      )}

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

        <TouchableOpacity
          style={styles.aboutLink}
          onPress={() => Linking.openURL('https://jermil32.github.io/duesoon-legal/privacy-policy.html')}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
          <Text style={[styles.aboutLinkText, { color: colors.text }]}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.aboutLink}
          onPress={() => Linking.openURL('https://jermil32.github.io/duesoon-legal/privacy-policy.html')}
        >
          <Ionicons name="document-text-outline" size={20} color={colors.primary} />
          <Text style={[styles.aboutLinkText, { color: colors.text }]}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.aboutLink}
          onPress={() => {
            const storeUrl = Platform.OS === 'ios'
              ? 'https://apps.apple.com/app/com.duesoon.app'
              : 'https://play.google.com/store/apps/details?id=com.duesoon.app';
            Linking.openURL(storeUrl);
          }}
        >
          <Ionicons name="star-outline" size={20} color={colors.primary} />
          <Text style={[styles.aboutLinkText, { color: colors.text }]}>Rate the App</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
