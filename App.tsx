import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

import { RootStackParamList, MainTabParamList } from './src/navigation/types';
import {
  HomeScreen,
  AssetsScreen,
  SettingsScreen,
  AddAssetScreen,
  AssetsByCategoryScreen,
  AssetDetailScreen,
  AddTaskScreen,
  TaskDetailScreen,
  LogMaintenanceScreen,
  OnboardingScreen,
  CalendarScreen,
} from './src/screens';
import {
  requestNotificationPermissions,
  setupNotificationCategories,
  scheduleSnoozeNotification,
  NOTIFICATION_ACTIONS,
} from './src/utils/notifications';
import { getSettings } from './src/storage';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LIGHT_COLORS } from './src/utils/constants';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab bar icons as SVG components
function HomeIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
        fill={color}
      />
    </Svg>
  );
}

function AssetsIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="3" y="3" width="7" height="7" rx="1" fill={color} />
      <Rect x="14" y="3" width="7" height="7" rx="1" fill={color} />
      <Rect x="3" y="14" width="7" height="7" rx="1" fill={color} />
      <Rect x="14" y="14" width="7" height="7" rx="1" fill={color} />
    </Svg>
  );
}

function SettingsIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="3" fill={color} />
      <Path
        d="M12 1L14 4H10L12 1ZM12 23L10 20H14L12 23ZM1 12L4 10V14L1 12ZM23 12L20 14V10L23 12ZM3.5 3.5L6 5L5 6L3.5 3.5ZM20.5 20.5L18 19L19 18L20.5 20.5ZM3.5 20.5L5 18L6 19L3.5 20.5ZM20.5 3.5L19 6L18 5L20.5 3.5Z"
        fill={color}
      />
    </Svg>
  );
}

function DueSoonTitle() {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row' }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: colors.secondary }}>Due</Text>
      <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary }}>Soon</Text>
    </View>
  );
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const { colors } = useTheme();
  const color = focused ? colors.primary : colors.textSecondary;
  const size = 24;

  switch (name) {
    case 'Home':
      return <HomeIcon size={size} color={color} />;
    case 'Assets':
      return <AssetsIcon size={size} color={color} />;
    case 'Settings':
      return <SettingsIcon size={size} color={color} />;
    default:
      return <HomeIcon size={size} color={color} />;
  }
}

function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <DueSoonTitle />,
        }}
      />
      <Tab.Screen
        name="Assets"
        component={AssetsScreen}
        options={{ title: 'My Assets' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { colors, isDark } = useTheme();

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddAsset"
          component={AddAssetScreen}
          options={{ title: 'Add Asset', presentation: 'modal' }}
        />
        <Stack.Screen
          name="AssetsByCategory"
          component={AssetsByCategoryScreen}
          options={{ title: 'Assets' }}
        />
        <Stack.Screen
          name="AssetDetail"
          component={AssetDetailScreen}
          options={{ title: 'Asset Details' }}
        />
        <Stack.Screen
          name="AddTask"
          component={AddTaskScreen}
          options={{ title: 'Add Task', presentation: 'modal' }}
        />
        <Stack.Screen
          name="TaskDetail"
          component={TaskDetailScreen}
          options={{ title: 'Task Details' }}
        />
        <Stack.Screen
          name="LogMaintenance"
          component={LogMaintenanceScreen}
          options={{ title: 'Log Maintenance', presentation: 'modal' }}
        />
        <Stack.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{ title: 'Calendar' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AppContent() {
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const notificationResponseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    const initApp = async () => {
      const settings = await getSettings();
      setShowOnboarding(!settings.onboardingCompleted);
      setIsLoading(false);
      await requestNotificationPermissions();
      await setupNotificationCategories();
    };
    initApp();

    // Handle notification responses (when user taps action buttons)
    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const actionId = response.actionIdentifier;
        const data = response.notification.request.content.data as {
          taskId?: string;
          assetId?: string;
          taskName?: string;
          assetName?: string;
        };

        // Handle snooze actions
        if (data.taskId && data.assetId && data.taskName && data.assetName) {
          let snoozeDays = 0;

          switch (actionId) {
            case NOTIFICATION_ACTIONS.REMIND_TOMORROW:
              snoozeDays = 1;
              break;
            case NOTIFICATION_ACTIONS.REMIND_3_DAYS:
              snoozeDays = 3;
              break;
            case NOTIFICATION_ACTIONS.REMIND_1_WEEK:
              snoozeDays = 7;
              break;
            case NOTIFICATION_ACTIONS.GOT_IT:
              // User acknowledged, no further action needed
              return;
            case Notifications.DEFAULT_ACTION_IDENTIFIER:
            default:
              // User tapped notification itself - show options dialog
              Alert.alert(
                data.taskName,
                `${data.assetName}\n\nWould you like to be reminded again?`,
                [
                  {
                    text: 'Remind Tomorrow',
                    onPress: () => scheduleSnoozeNotification(
                      data.taskId!,
                      data.assetId!,
                      data.taskName!,
                      data.assetName!,
                      1
                    ),
                  },
                  {
                    text: 'Remind in 3 Days',
                    onPress: () => scheduleSnoozeNotification(
                      data.taskId!,
                      data.assetId!,
                      data.taskName!,
                      data.assetName!,
                      3
                    ),
                  },
                  {
                    text: 'Remind in 1 Week',
                    onPress: () => scheduleSnoozeNotification(
                      data.taskId!,
                      data.assetId!,
                      data.taskName!,
                      data.assetName!,
                      7
                    ),
                  },
                  {
                    text: 'Got It',
                    style: 'cancel',
                  },
                ]
              );
              return;
          }

          if (snoozeDays > 0) {
            await scheduleSnoozeNotification(
              data.taskId,
              data.assetId,
              data.taskName,
              data.assetName,
              snoozeDays
            );
          }
        }
      }
    );

    return () => {
      if (notificationResponseListener.current) {
        notificationResponseListener.current.remove();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (showOnboarding) {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      </>
    );
  }

  return <AppNavigator />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
