import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MainTabScreenProps } from '../navigation/types';
import { Asset, MaintenanceTask } from '../types';
import { getAssets, getTasks } from '../storage';
import { getTaskStatus } from '../utils/dates';
import { COLORS, SPACING, FONT_SIZE, CATEGORY_LABELS } from '../utils/constants';

type Props = MainTabScreenProps<'Assets'>;

export default function AssetsScreen({ navigation }: Props) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [loadedAssets, loadedTasks] = await Promise.all([getAssets(), getTasks()]);
    setAssets(loadedAssets.sort((a, b) => b.updatedAt - a.updatedAt));
    setTasks(loadedTasks);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getAssetStats = (assetId: string) => {
    const assetTasks = tasks.filter((t) => t.assetId === assetId);
    const overdue = assetTasks.filter((t) => getTaskStatus(t) === 'overdue').length;
    const dueSoon = assetTasks.filter((t) => getTaskStatus(t) === 'due-soon').length;
    return { total: assetTasks.length, overdue, dueSoon };
  };

  const renderAssetItem = ({ item }: { item: Asset }) => {
    const stats = getAssetStats(item.id);
    const hasIssues = stats.overdue > 0 || stats.dueSoon > 0;

    return (
      <TouchableOpacity
        style={styles.assetCard}
        onPress={() => navigation.navigate('AssetDetail', { assetId: item.id })}
      >
        <View style={styles.assetIcon}>
          <Text style={styles.assetIconText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.assetContent}>
          <Text style={styles.assetName}>{item.name}</Text>
          <Text style={styles.assetCategory}>{CATEGORY_LABELS[item.category]}</Text>
          {item.make && item.model && (
            <Text style={styles.assetDetails}>
              {item.year ? `${item.year} ` : ''}
              {item.make} {item.model}
            </Text>
          )}
        </View>
        <View style={styles.assetStats}>
          {hasIssues ? (
            <>
              {stats.overdue > 0 && (
                <View style={[styles.badge, { backgroundColor: COLORS.overdue }]}>
                  <Text style={styles.badgeText}>{stats.overdue}</Text>
                </View>
              )}
              {stats.dueSoon > 0 && (
                <View style={[styles.badge, { backgroundColor: COLORS.dueSoon }]}>
                  <Text style={[styles.badgeText, { color: COLORS.text }]}>{stats.dueSoon}</Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.taskCount}>{stats.total} tasks</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Assets Yet</Text>
      <Text style={styles.emptyText}>
        Add your vehicles, equipment, and property to start tracking maintenance.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={assets}
        renderItem={renderAssetItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={assets.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddAsset')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
  },
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  assetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  assetIconText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.surface,
  },
  assetContent: {
    flex: 1,
  },
  assetName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  assetCategory: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    marginTop: 2,
  },
  assetDetails: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  assetStats: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.surface,
  },
  taskCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    fontWeight: '400',
    color: COLORS.surface,
    marginTop: -2,
  },
});
