import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

import { AssetCategory, MaintenanceTask, Asset } from '../types';

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  AddAsset: { assetId?: string; category?: AssetCategory } | undefined;
  AssetsByCategory: { category: AssetCategory };
  AssetDetail: { assetId: string };
  AddTask: { assetId: string; taskId?: string };
  TaskDetail: { taskId: string; task?: MaintenanceTask; asset?: Asset };
  LogMaintenance: { taskId: string; logId?: string };
  Calendar: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Assets: undefined;
  Settings: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
