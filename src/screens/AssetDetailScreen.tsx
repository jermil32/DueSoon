import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackScreenProps } from '../navigation/types';
import { Asset, MaintenanceTask } from '../types';
import { getAssets, getTasksForAsset, deleteAsset } from '../storage';
import { getTaskStatus, formatDate, getDaysUntilDue, formatInterval } from '../utils/dates';
import { COLORS, SPACING, FONT_SIZE, CATEGORY_LABELS } from '../utils/constants';

type Props = RootStackScreenProps<'AssetDetail'>;

export default function AssetDetailScreen({ navigation, route }: Props) {
  const { assetId } = route.params;
  const [asset, setAsset] = useState<Asset | null>(null);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [assets, assetTasks] = await Promise.all([
        getAssets(),
        getTasksForAsset(assetId),
      ]);
      const foundAsset = assets.find((a) => a.id === assetId);
      if (!foundAsset) {
        setError('Asset not found');
        setAsset(null);
      } else {
        setAsset(foundAsset);
        setTasks(assetTasks.sort((a, b) => {
          if (!a.nextDue && !b.nextDue) return 0;
          if (!a.nextDue) return 1;
          if (!b.nextDue) return -1;
          return a.nextDue - b.nextDue;
        }));
      }
    } catch (err) {
      setError('Failed to load asset data. Please try again.');
      console.error('Error loading asset:', err);
    } finally {
      setLoading(false);
    }
  }, [assetId]);

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

  const handleDelete = () => {
    Alert.alert(
      'Delete Asset',
      `Are you sure you want to delete "${asset?.name}"? This will also delete all associated maintenance tasks and history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAsset(assetId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const getStatusColor = (status: ReturnType<typeof getTaskStatus>) => {
    switch (status) {
      case 'overdue':
        return COLORS.overdue;
      case 'due-soon':
        return COLORS.dueSoon;
      case 'upcoming':
        return COLORS.upcoming;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusText = (task: MaintenanceTask) => {
    if (!task.nextDue) return 'No due date';
    const days = getDaysUntilDue(task.nextDue);
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  const renderTaskItem = ({ item }: { item: MaintenanceTask }) => {
    const status = getTaskStatus(item);
    return (
      <TouchableOpacity
        style={styles.taskCard}
        onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
      >
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) }]} />
        <View style={styles.taskContent}>
          <Text style={styles.taskName}>{item.name}</Text>
          <Text style={styles.taskInterval}>{formatInterval(item.interval)}</Text>
          <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
            {getStatusText(item)}
          </Text>
        </View>
        {item.nextDue && (
          <Text style={styles.dueDate}>{formatDate(item.nextDue)}</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error || !asset) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Asset not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.assetIcon}>
              <Text style={styles.assetIconText}>
                {asset.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.assetName}>{asset.name}</Text>
            <Text style={styles.assetCategory}>{CATEGORY_LABELS[asset.category]}</Text>
            {asset.make && asset.model && (
              <Text style={styles.assetDetails}>
                {asset.year ? `${asset.year} ` : ''}
                {asset.make} {asset.model}
              </Text>
            )}
            {asset.notes && (
              <Text style={styles.assetNotes}>{asset.notes}</Text>
            )}

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('AddAsset', { assetId: asset.id })}
                accessibilityLabel={`Edit ${asset.name}`}
                accessibilityRole="button"
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                accessibilityLabel={`Delete ${asset.name}`}
                accessibilityRole="button"
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Maintenance Tasks</Text>
              <Text style={styles.taskCount}>{tasks.length} tasks</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No maintenance tasks yet.</Text>
            <Text style={styles.emptySubtext}>
              Add tasks to track maintenance schedules.
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTask', { assetId: asset.id })}
        accessibilityLabel="Add maintenance task"
        accessibilityRole="button"
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
    paddingBottom: SPACING.xl + 56,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: SPACING.xl,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  retryButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  backButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  header: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  assetIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  assetIconText: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.surface,
  },
  assetName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  assetCategory: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  assetDetails: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  assetNotes: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  editButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.secondary,
  },
  editButtonText: {
    color: COLORS.surface,
    fontWeight: '500',
  },
  deleteButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  taskCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusIndicator: {
    width: 4,
    height: '100%',
    minHeight: 50,
    borderRadius: 2,
    marginRight: SPACING.md,
  },
  taskContent: {
    flex: 1,
  },
  taskName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
    color: COLORS.text,
  },
  taskInterval: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    marginTop: 4,
  },
  dueDate: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
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
