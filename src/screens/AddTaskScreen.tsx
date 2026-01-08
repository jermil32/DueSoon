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
import { RootStackScreenProps } from '../navigation/types';
import { MaintenanceTask, MaintenanceInterval, Asset } from '../types';
import { addTask, getTasks, updateTask, getAssets } from '../storage';
import { calculateNextDueDate } from '../utils/dates';
import { requestNotificationPermissions, scheduleTaskNotification } from '../utils/notifications';
import { COLORS, SPACING, FONT_SIZE, DEFAULT_MAINTENANCE_TEMPLATES } from '../utils/constants';

type Props = RootStackScreenProps<'AddTask'>;

const INTERVAL_TYPES = [
  { key: 'days', label: 'Days' },
  { key: 'months', label: 'Months' },
  { key: 'years', label: 'Years' },
  { key: 'miles', label: 'Miles' },
  { key: 'hours', label: 'Hours' },
] as const;

export default function AddTaskScreen({ navigation, route }: Props) {
  const { assetId, taskId } = route.params;
  const isEditing = !!taskId;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [intervalType, setIntervalType] = useState<MaintenanceInterval['type']>('months');
  const [intervalValue, setIntervalValue] = useState('');
  const [reminderDays, setReminderDays] = useState('7');
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(!isEditing);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const assets = await getAssets();
    const foundAsset = assets.find((a) => a.id === assetId);
    setAsset(foundAsset || null);

    if (taskId) {
      const tasks = await getTasks();
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setName(task.name);
        setDescription(task.description || '');
        setIntervalType(task.interval.type);
        setIntervalValue(task.interval.value.toString());
        setReminderDays(task.reminderDaysBefore.toString());
      }
    }
  };

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Task' : 'Add Maintenance Task',
    });
  }, [navigation, isEditing]);

  const applyTemplate = (template: {
    name: string;
    intervalType: string;
    intervalValue: number;
    reminderDays: number;
  }) => {
    setName(template.name);
    setIntervalType(template.intervalType as MaintenanceInterval['type']);
    setIntervalValue(template.intervalValue.toString());
    setReminderDays(template.reminderDays.toString());
    setShowTemplates(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }

    const value = parseInt(intervalValue, 10);
    if (!value || value <= 0) {
      Alert.alert('Error', 'Please enter a valid interval');
      return;
    }

    const reminder = parseInt(reminderDays, 10);
    if (isNaN(reminder) || reminder < 0) {
      Alert.alert('Error', 'Please enter a valid reminder period');
      return;
    }

    setLoading(true);

    try {
      const now = Date.now();
      const interval: MaintenanceInterval = { type: intervalType, value };

      const task: MaintenanceTask = {
        id: taskId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        name: name.trim(),
        description: description.trim() || undefined,
        interval,
        reminderDaysBefore: reminder,
        createdAt: isEditing ? now : now,
        updatedAt: now,
      };

      if (isEditing) {
        // Preserve existing completion data
        const tasks = await getTasks();
        const existingTask = tasks.find((t) => t.id === taskId);
        if (existingTask) {
          task.lastCompleted = existingTask.lastCompleted;
          task.lastMileage = existingTask.lastMileage;
          task.lastHours = existingTask.lastHours;
          task.nextDue = existingTask.lastCompleted
            ? calculateNextDueDate(existingTask.lastCompleted, interval)
            : undefined;
          task.notificationId = existingTask.notificationId;
        }
        await updateTask(task);
      } else {
        await addTask(task);
      }

      // Schedule notification if we have a due date
      if (task.nextDue && asset) {
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
          const notificationId = await scheduleTaskNotification(task, asset);
          if (notificationId) {
            task.notificationId = notificationId;
            await updateTask(task);
          }
        }
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const templates = asset ? DEFAULT_MAINTENANCE_TEMPLATES[asset.category] : [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {showTemplates && templates.length > 0 && (
          <View style={styles.templatesSection}>
            <Text style={styles.templatesTitle}>Quick Add Templates</Text>
            <View style={styles.templatesContainer}>
              {templates.map((template, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.templateButton}
                  onPress={() => applyTemplate(template)}
                >
                  <Text style={styles.templateText}>{template.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.customButton}
              onPress={() => setShowTemplates(false)}
            >
              <Text style={styles.customButtonText}>Create Custom Task</Text>
            </TouchableOpacity>
          </View>
        )}

        {!showTemplates && (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Task Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Oil Change"
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Optional notes about this task..."
                placeholderTextColor={COLORS.textLight}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Maintenance Interval</Text>
              <View style={styles.intervalRow}>
                <TextInput
                  style={[styles.input, styles.intervalInput]}
                  value={intervalValue}
                  onChangeText={setIntervalValue}
                  placeholder="e.g., 3"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="number-pad"
                />
                <View style={styles.intervalTypeContainer}>
                  {INTERVAL_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.intervalTypeButton,
                        intervalType === type.key && styles.intervalTypeButtonActive,
                      ]}
                      onPress={() => setIntervalType(type.key)}
                    >
                      <Text
                        style={[
                          styles.intervalTypeText,
                          intervalType === type.key && styles.intervalTypeTextActive,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Remind Me (days before due)</Text>
              <TextInput
                style={[styles.input, { width: 100 }]}
                value={reminderDays}
                onChangeText={setReminderDays}
                placeholder="7"
                placeholderTextColor={COLORS.textLight}
                keyboardType="number-pad"
              />
            </View>

            {templates.length > 0 && (
              <TouchableOpacity
                style={styles.showTemplatesButton}
                onPress={() => setShowTemplates(true)}
              >
                <Text style={styles.showTemplatesText}>Show Templates</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {!showTemplates && (
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
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Task'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  templatesSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  templatesTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  templatesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  templateButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
  },
  templateText: {
    color: COLORS.surface,
    fontWeight: '500',
  },
  customButton: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  customButtonText: {
    color: COLORS.secondary,
    fontWeight: '500',
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
  intervalRow: {
    gap: SPACING.sm,
  },
  intervalInput: {
    width: 100,
  },
  intervalTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  intervalTypeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  intervalTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  intervalTypeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  intervalTypeTextActive: {
    color: COLORS.surface,
    fontWeight: '500',
  },
  showTemplatesButton: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  showTemplatesText: {
    color: COLORS.secondary,
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
    backgroundColor: COLORS.primary,
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
