import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';

import { RootStackParamList, MainTabParamList } from './src/navigation/types';
import {
  HomeScreen,
  AssetsScreen,
  SettingsScreen,
  AddAssetScreen,
  AssetDetailScreen,
  AddTaskScreen,
  TaskDetailScreen,
  LogMaintenanceScreen,
} from './src/screens';
import { requestNotificationPermissions } from './src/utils/notifications';
import { COLORS } from './src/utils/constants';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: focused ? '●' : '○',
    Assets: focused ? '■' : '□',
    Settings: focused ? '◆' : '◇',
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <Text
        style={{
          fontSize: 20,
          color: focused ? COLORS.primary : COLORS.textSecondary,
        }}
      >
        {icons[name] || '○'}
      </Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
        },
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'DueSoon',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 24,
            color: COLORS.primary,
          },
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

export default function App() {
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.surface,
          },
          headerTintColor: COLORS.text,
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
