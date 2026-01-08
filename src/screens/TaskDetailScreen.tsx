import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackScreenProps } from '../navigation/types';
import { MaintenanceTask, Asset, MaintenanceLog } from '../types';
import { getTasks, getAssets, deleteTask, getLogsForTask } from '../storage';
import { cancelNotification } from '../utils/notifications';
import {
  getTaskStatus,
  formatDate,
  getDaysUntilDue,
  formatInterval,
} from '../utils/dates';
import { COLORS, SPACING, FONT_SIZE } from '../utils/constants';

type Props = RootStackScreenProps<'TaskDetail'>;

export default function TaskDetailScreen({ navigation, route }: Props) {
  const { taskId } = route.params;
  const [task, setTask] = useState<MaintenanceTask | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);

  const loadData = useCallback(async () => {
    const [tasks, assets, taskLogs] = await Promise.all([
      getTasks(),
      getAssets(),
      getLogsForTask(taskId),
    ]);
    const foundTask = tasks.find((t) => t.id === taskId);
    setTask(foundTask || null);
    if (foundTask) {
      const foundAsset = assets.find((a) => a.id === foundTask.assetId);
      setAsset(foundAsset || null);
    }
    setLogs(taskLogs);
  }, [taskId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task?.name}"? This will also delete all maintenance history for this task.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (task?.notificationId) {
              await cancelNotification(task.notificationId);
            }
            await deleteTask(taskId);
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

  const getStatusText = () => {
    if (!task?.nextDue) return 'No due date set';
    const days = getDaysUntilDue(task.nextDue);
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  const renderLogItem = ({ item }: { item: MaintenanceLog }) => (
    <View style={styles.logItem}>
      <View style={styles.logDot} />
      <View style={styles.logContent}>
        <Text style={styles.logDate}>{formatDate(item.completedAt)}</Text>
        {item.mileage && (
          <Text style={styles.logDetail}>
            {item.mileage.toLocaleString()} miles
          </Text>
        )}
        {item.hours && (
          <Text style={styles.logDetail}>{item.hours.toLocaleString()} hours</Text>
        )}
        {item.cost && (
          <Text style={styles.logDetail}>${item.cost.toFixed(2)}</Text>
        )}
        {item.notes && <Text style={styles.logNotes}>{item.notes}</Text>}
      </View>
    </View>
  );

  if (!task || !asset) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const status = getTaskStatus(task);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.taskName}>{task.name}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AssetDetail', { assetId: asset.id })}
          >
            <Text style={styles.assetName}>{asset.name}</Text>
          </TouchableOpacity>

          {task.description && (
            <Text style={styles.description}>{task.description}</Text>
          )}

          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}
          >
            <Text style={styles.statusBadgeText}>{getStatusText()}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Interval</Text>
            <Text style={styles.infoValue}>{formatInterval(task.interval)}</Text>
          </View>

          {task.nextDue && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Next Due</Text>
              <Text style={styles.infoValue}>{formatDate(task.nextDue)}</Text>
            </View>
          )}

          {task.lastCompleted && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Completed</Text>
              <Text style={styles.infoValue}>{formatDate(task.lastCompleted)}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reminder</Text>
            <Text style={styles.infoValue}>
              {task.reminderDaysBefore} days before due
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logMaintenanceButton}
          onPress={() => navigation.navigate('LogMaintenance', { taskId: task.id })}
        >
          <Text style={styles.logMaintenanceButtonText}>Log Maintenance</Text>
        </TouchableOpacity>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Maintenance History</Text>
          {logs.length === 0 ? (
            <Text style={styles.emptyHistory}>
              No maintenance logged yet. Complete this task to start tracking.
            </Text>
          ) : (
            <View style={styles.timeline}>
              {logs.map((log) => (
                <View key={log.id}>{renderLogItem({ item: log })}</View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() =>
            navigation.navigate('AddTask', { assetId: asset.id, taskId: task.id })
          }
        >
          <Text style={styles.editButtonText}>Edit Task</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: SPACING.xl,
    color: COLORS.textSecondary,
  },
  header: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  taskName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  assetName: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  statusBadge: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: FONT_SIZE.md,
  },
  infoSection: {
    backgroundColor: COLORS.surface,
    marginTop: SPACING.md,
    padding: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  logMaintenanceButton: {
    backgroundColor: COLORS.success,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  logMaintenanceButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  historySection: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  emptyHistory: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: SPACING.lg,
  },
  timeline: {
    paddingLeft: SPACING.sm,
  },
  logItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  logDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginTop: 4,
    marginRight: SPACING.md,
  },
  logContent: {
    flex: 1,
  },
  logDate: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  logDetail: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logNotes: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  editButton: {
    flex: 2,
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
  },
  editButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.danger,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
  },
});
