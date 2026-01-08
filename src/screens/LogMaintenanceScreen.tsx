import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RootStackScreenProps } from '../navigation/types';
import { MaintenanceTask, MaintenanceLog, Asset } from '../types';
import { getTasks, updateTask, addLog, getAssets } from '../storage';
import { calculateNextDueDate, formatDate } from '../utils/dates';
import { scheduleTaskNotification, requestNotificationPermissions } from '../utils/notifications';
import { COLORS, SPACING, FONT_SIZE } from '../utils/constants';

type Props = RootStackScreenProps<'LogMaintenance'>;

export default function LogMaintenanceScreen({ navigation, route }: Props) {
  const { taskId } = route.params;

  const [task, setTask] = useState<MaintenanceTask | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [completedDate, setCompletedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [estimatedMonths, setEstimatedMonths] = useState('');
  const [mileage, setMileage] = useState('');
  const [hours, setHours] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [tasks, assets] = await Promise.all([getTasks(), getAssets()]);
    const foundTask = tasks.find((t) => t.id === taskId);
    setTask(foundTask || null);
    if (foundTask) {
      const foundAsset = assets.find((a) => a.id === foundTask.assetId);
      setAsset(foundAsset || null);
      if (foundTask.lastMileage) {
        setMileage(foundTask.lastMileage.toString());
      }
      if (foundTask.lastHours) {
        setHours(foundTask.lastHours.toString());
      }
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setCompletedDate(selectedDate);
    }
  };


  const handleSave = async () => {
    if (!task || !asset) return;

    setLoading(true);

    try {
      const now = Date.now();
      const completedAt = completedDate.getTime();

      const log: MaintenanceLog = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        taskId: task.id,
        assetId: task.assetId,
        completedAt,
        mileage: mileage ? parseInt(mileage, 10) : undefined,
        hours: hours ? parseInt(hours, 10) : undefined,
        cost: cost ? parseFloat(cost) : undefined,
        notes: notes.trim() || undefined,
        createdAt: now,
      };

      await addLog(log);

      const updatedTask: MaintenanceTask = {
        ...task,
        lastCompleted: completedAt,
        lastMileage: log.mileage,
        lastHours: log.hours,
        nextDue: calculateNextDueDate(completedAt, task.interval),
        updatedAt: now,
      };

      if (task.interval.type === 'miles' && log.mileage) {
        updatedTask.nextDueMileage = log.mileage + task.interval.value;
        // Calculate estimated date from months input
        if (estimatedMonths && parseInt(estimatedMonths, 10) > 0) {
          const estDate = new Date(completedAt);
          estDate.setMonth(estDate.getMonth() + parseInt(estimatedMonths, 10));
          updatedTask.nextDue = estDate.getTime();
        }
      }
      if (task.interval.type === 'hours' && log.hours) {
        updatedTask.nextDueHours = log.hours + task.interval.value;
        // Calculate estimated date from months input
        if (estimatedMonths && parseInt(estimatedMonths, 10) > 0) {
          const estDate = new Date(completedAt);
          estDate.setMonth(estDate.getMonth() + parseInt(estimatedMonths, 10));
          updatedTask.nextDue = estDate.getTime();
        }
      }

      await updateTask(updatedTask);

      if (updatedTask.nextDue) {
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
          const notificationId = await scheduleTaskNotification(updatedTask, asset);
          if (notificationId) {
            updatedTask.notificationId = notificationId;
            await updateTask(updatedTask);
          }
        }
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to log maintenance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isToday = () => {
    const today = new Date();
    return (
      completedDate.getDate() === today.getDate() &&
      completedDate.getMonth() === today.getMonth() &&
      completedDate.getFullYear() === today.getFullYear()
    );
  };

  if (!task) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const showMileage = task.interval.type === 'miles' || task.lastMileage;
  const showHours = task.interval.type === 'hours' || task.lastHours;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.taskInfo}>
          <Text style={styles.taskName}>{task.name}</Text>
          <Text style={styles.assetName}>{asset?.name}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Completed Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {formatDate(completedDate.getTime())}
            </Text>
            {isToday() && <Text style={styles.dateHint}>(Today)</Text>}
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Date Picker - shown inline on iOS */}
        {showDatePicker && (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={completedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
              style={styles.datePicker}
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.datePickerDone}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {showMileage && (
          <View style={styles.field}>
            <Text style={styles.label}>Current Mileage</Text>
            <TextInput
              style={styles.input}
              value={mileage}
              onChangeText={setMileage}
              placeholder="e.g., 50000"
              placeholderTextColor={COLORS.textLight}
              keyboardType="number-pad"
            />
            {task.lastMileage && (
              <Text style={styles.hint}>
                Last recorded: {task.lastMileage.toLocaleString()} miles
              </Text>
            )}
          </View>
        )}

        {showHours && (
          <View style={styles.field}>
            <Text style={styles.label}>Current Hours</Text>
            <TextInput
              style={styles.input}
              value={hours}
              onChangeText={setHours}
              placeholder="e.g., 500"
              placeholderTextColor={COLORS.textLight}
              keyboardType="number-pad"
            />
            {task.lastHours && (
              <Text style={styles.hint}>
                Last recorded: {task.lastHours.toLocaleString()} hours
              </Text>
            )}
          </View>
        )}

        {/* Estimated time until next service for miles/hours intervals */}
        {(task.interval.type === 'miles' || task.interval.type === 'hours') && (
          <View style={styles.field}>
            <Text style={styles.label}>Remind me in how many months?</Text>
            <Text style={styles.hint}>
              Next service at {task.interval.type === 'miles'
                ? `${((mileage ? parseInt(mileage, 10) : 0) + task.interval.value).toLocaleString()} miles`
                : `${((hours ? parseInt(hours, 10) : 0) + task.interval.value).toLocaleString()} hours`
              }
            </Text>
            <TextInput
              style={[styles.input, { width: 120 }]}
              value={estimatedMonths}
              onChangeText={setEstimatedMonths}
              placeholder="e.g., 3"
              placeholderTextColor={COLORS.textLight}
              keyboardType="number-pad"
            />
            {estimatedMonths && parseInt(estimatedMonths, 10) > 0 && (
              <Text style={styles.hint}>
                Reminder will be set for {formatDate(
                  new Date(completedDate.getTime()).setMonth(
                    completedDate.getMonth() + parseInt(estimatedMonths, 10)
                  )
                )}
              </Text>
            )}
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Cost (optional)</Text>
          <TextInput
            style={styles.input}
            value={cost}
            onChangeText={setCost}
            placeholder="e.g., 75.00"
            placeholderTextColor={COLORS.textLight}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional details..."
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Log Maintenance'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  content: {
    padding: SPACING.md,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: SPACING.xl,
    color: COLORS.textSecondary,
  },
  taskInfo: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  taskName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text,
  },
  assetName: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  field: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  dateButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  dateHint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  changeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    marginLeft: 'auto',
  },
  datePickerContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: SPACING.lg,
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
  footer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  saveButton: {
    flex: 2,
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.surface,
    fontWeight: '600',
  },
});
