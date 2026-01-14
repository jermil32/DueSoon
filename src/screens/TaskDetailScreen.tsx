import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  FlatList,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { RootStackScreenProps } from '../navigation/types';
import { MaintenanceTask, Asset, MaintenanceLog } from '../types';
import { getTasks, getAssets, deleteTask, getLogsForTask, updateTask } from '../storage';
import { cancelNotification, scheduleTaskNotification, requestNotificationPermissions } from '../utils/notifications';
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
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [tasks, assets, taskLogs] = await Promise.all([
        getTasks(),
        getAssets(),
        getLogsForTask(taskId),
      ]);
      const foundTask = tasks.find((t) => t.id === taskId);
      if (!foundTask) {
        setError('Task not found');
        setTask(null);
        setAsset(null);
      } else {
        setTask(foundTask);
        const foundAsset = assets.find((a) => a.id === foundTask.assetId);
        if (!foundAsset) {
          setError('Associated asset not found');
        }
        setAsset(foundAsset || null);
      }
      setLogs(taskLogs);
    } catch (err) {
      setError('Failed to load task data. Please try again.');
      console.error('Error loading task:', err);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  const handleEditLog = (log: MaintenanceLog) => {
    navigation.navigate('LogMaintenance', { taskId: log.taskId, logId: log.id });
  };

  const handleChangeDueDate = () => {
    if (task?.nextDue) {
      setSelectedDueDate(new Date(task.nextDue));
    } else {
      setSelectedDueDate(new Date());
    }
    setShowDueDatePicker(true);
  };

  const onDueDateChange = async (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDueDatePicker(false);
    }
    if (selectedDate && task && asset) {
      setSelectedDueDate(selectedDate);

      const updatedTask: MaintenanceTask = {
        ...task,
        nextDue: selectedDate.getTime(),
        updatedAt: Date.now(),
      };

      await updateTask(updatedTask);

      // Reschedule notification
      if (task.notificationId) {
        await cancelNotification(task.notificationId);
      }
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        const notificationId = await scheduleTaskNotification(updatedTask, asset);
        if (notificationId) {
          updatedTask.notificationId = notificationId;
          await updateTask(updatedTask);
        }
      }

      setTask(updatedTask);
    }
  };

  const renderLogItem = ({ item, index }: { item: MaintenanceLog; index: number }) => {
    const isFirst = index === 0;
    const isLast = index === logs.length - 1;

    return (
      <TouchableOpacity
        style={styles.logItem}
        onPress={() => handleEditLog(item)}
        activeOpacity={0.7}
      >
        <View style={styles.timelineColumn}>
          {!isFirst && <View style={styles.timelineLineTop} />}
          <View style={[styles.logDot, isFirst && styles.logDotFirst]} />
          {!isLast && <View style={styles.timelineLineBottom} />}
        </View>
        <View style={styles.logCard}>
          <View style={styles.logCardHeader}>
            <Text style={styles.logDate}>{formatDate(item.completedAt)}</Text>
            <Text style={styles.editHint}>Edit</Text>
          </View>
          <View style={styles.logCardBody}>
            {item.mileage && (
              <View style={styles.logDetailRow}>
                <Text style={styles.logDetailLabel}>Odometer:</Text>
                <Text style={styles.logDetailValue}>
                  {item.mileage.toLocaleString()} mi
                </Text>
              </View>
            )}
            {item.hours && (
              <View style={styles.logDetailRow}>
                <Text style={styles.logDetailLabel}>Hours:</Text>
                <Text style={styles.logDetailValue}>
                  {item.hours.toLocaleString()} hrs
                </Text>
              </View>
            )}
            {item.cost && (
              <View style={styles.logDetailRow}>
                <Text style={styles.logDetailLabel}>Cost:</Text>
                <Text style={styles.logDetailValue}>${item.cost.toFixed(2)}</Text>
              </View>
            )}
            {item.notes && (
              <Text style={styles.logNotes}>"{item.notes}"</Text>
            )}
          </View>
        </View>
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

  if (error || !task || !asset) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Task not found'}</Text>
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

          <TouchableOpacity style={styles.infoRow} onPress={handleChangeDueDate}>
            <Text style={styles.infoLabel}>Next Due</Text>
            <View style={styles.dueDateValue}>
              <Text style={styles.infoValue}>
                {task.nextDue ? formatDate(task.nextDue) : 'Not set'}
              </Text>
              <Text style={styles.changeHint}>Change</Text>
            </View>
          </TouchableOpacity>

          {showDueDatePicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={selectedDueDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={onDueDateChange}
                minimumDate={new Date()}
                style={styles.datePicker}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.datePickerDone}
                  onPress={() => setShowDueDatePicker(false)}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              )}
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

          {/* Fluid change details */}
          {(task.filterPartNumber || task.fluidType || task.fluidCapacity) && (
            <>
              {task.filterPartNumber && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Filter Part #</Text>
                  <Text style={styles.infoValue}>{task.filterPartNumber}</Text>
                </View>
              )}
              {task.fluidType && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Fluid Type</Text>
                  <Text style={styles.infoValue}>{task.fluidType}</Text>
                </View>
              )}
              {task.fluidCapacity && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Capacity</Text>
                  <Text style={styles.infoValue}>{task.fluidCapacity}</Text>
                </View>
              )}
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.logMaintenanceButton}
          onPress={() => navigation.navigate('LogMaintenance', { taskId: task.id })}
          accessibilityLabel={`Log maintenance for ${task.name}`}
          accessibilityRole="button"
        >
          <Text style={styles.logMaintenanceButtonText}>Log Maintenance</Text>
        </TouchableOpacity>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Maintenance History</Text>
          {logs.length === 0 ? (
            <View style={styles.emptyHistoryContainer}>
              <Text style={styles.emptyHistoryIcon}>📋</Text>
              <Text style={styles.emptyHistory}>
                No maintenance logged yet
              </Text>
              <Text style={styles.emptyHistoryHint}>
                Tap "Log Maintenance" above to record your first service and start building your maintenance history.
              </Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {logs.map((log, index) => (
                <View key={log.id}>{renderLogItem({ item: log, index })}</View>
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
          accessibilityLabel={`Edit ${task.name}`}
          accessibilityRole="button"
        >
          <Text style={styles.editButtonText}>Edit Task</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          accessibilityLabel={`Delete ${task.name}`}
          accessibilityRole="button"
        >
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
  dueDateValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  changeHint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
  },
  datePickerContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginVertical: SPACING.sm,
    padding: SPACING.md,
  },
  datePicker: {
    height: 320,
  },
  datePickerDone: {
    alignItems: 'center',
    padding: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  datePickerDoneText: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
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
  emptyHistoryContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyHistoryIcon: {
    fontSize: 40,
    marginBottom: SPACING.md,
  },
  emptyHistory: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptyHistoryHint: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  timeline: {
    paddingLeft: SPACING.xs,
    marginTop: SPACING.sm,
  },
  logItem: {
    flexDirection: 'row',
    minHeight: 80,
  },
  timelineColumn: {
    width: 24,
    alignItems: 'center',
  },
  timelineLineTop: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
  },
  timelineLineBottom: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
  },
  logDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.surface,
    zIndex: 1,
  },
  logDotFirst: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.success,
    borderWidth: 3,
  },
  logCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    marginLeft: SPACING.sm,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  logCardBody: {
    gap: SPACING.xs,
  },
  logDate: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  logDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logDetailLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  logDetailValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  logNotes: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  editHint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '500',
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
