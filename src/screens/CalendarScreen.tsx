import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar, DateData } from 'react-native-calendars';
import { RootStackScreenProps } from '../navigation/types';
import { MaintenanceTask, Asset } from '../types';
import { getAssets, getTasks } from '../storage';
import { getTaskStatus, getDaysUntilDue, formatDate } from '../utils/dates';
import { SPACING, FONT_SIZE } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';
import * as Haptics from 'expo-haptics';

type Props = RootStackScreenProps<'Calendar'>;

interface MarkedDates {
  [date: string]: {
    marked?: boolean;
    dotColor?: string;
    dots?: Array<{ key: string; color: string }>;
    selected?: boolean;
    selectedColor?: string;
  };
}

export default function CalendarScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const loadData = useCallback(async () => {
    const [loadedAssets, loadedTasks] = await Promise.all([
      getAssets(),
      getTasks(),
    ]);
    setAssets(loadedAssets);
    setTasks(loadedTasks);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getAssetName = (assetId: string) => {
    return assets.find((a) => a.id === assetId)?.name || 'Unknown Asset';
  };

  const getMarkedDates = (): MarkedDates => {
    const marked: MarkedDates = {};

    tasks.forEach((task) => {
      if (task.nextDue) {
        const dateStr = new Date(task.nextDue).toISOString().split('T')[0];
        const status = getTaskStatus(task);
        let dotColor = colors.upcoming;
        if (status === 'overdue') dotColor = colors.overdue;
        else if (status === 'due-soon') dotColor = colors.dueSoon;

        if (!marked[dateStr]) {
          marked[dateStr] = { dots: [] };
        }
        marked[dateStr].dots?.push({ key: task.id, color: dotColor });
        marked[dateStr].marked = true;
      }
    });

    // Mark selected date
    if (marked[selectedDate]) {
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = colors.primary;
    } else {
      marked[selectedDate] = {
        selected: true,
        selectedColor: colors.primary,
      };
    }

    return marked;
  };

  const getTasksForDate = (dateStr: string) => {
    return tasks.filter((task) => {
      if (!task.nextDue) return false;
      const taskDate = new Date(task.nextDue).toISOString().split('T')[0];
      return taskDate === dateStr;
    });
  };

  const handleDayPress = (day: DateData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(day.dateString);
  };

  const handleTaskPress = (task: MaintenanceTask) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('TaskDetail', { taskId: task.id });
  };

  const selectedTasks = getTasksForDate(selectedDate);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    calendarContainer: {
      backgroundColor: colors.surface,
      paddingBottom: SPACING.md,
    },
    tasksContainer: {
      flex: 1,
      padding: SPACING.md,
    },
    sectionTitle: {
      fontSize: FONT_SIZE.lg,
      fontWeight: '600',
      color: colors.text,
      marginBottom: SPACING.md,
    },
    taskCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: SPACING.md,
    },
    taskContent: {
      flex: 1,
    },
    taskName: {
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
      color: colors.text,
    },
    assetName: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    emptyText: {
      fontSize: FONT_SIZE.md,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: SPACING.xl,
    },
    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: SPACING.lg,
      paddingVertical: SPACING.sm,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendText: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
    },
  });

  const calendarTheme = {
    backgroundColor: colors.surface,
    calendarBackground: colors.surface,
    textSectionTitleColor: colors.textSecondary,
    selectedDayBackgroundColor: colors.primary,
    selectedDayTextColor: '#ffffff',
    todayTextColor: colors.primary,
    dayTextColor: colors.text,
    textDisabledColor: colors.textLight,
    dotColor: colors.primary,
    selectedDotColor: '#ffffff',
    arrowColor: colors.primary,
    monthTextColor: colors.text,
    indicatorColor: colors.primary,
    textDayFontWeight: '400' as const,
    textMonthFontWeight: '600' as const,
    textDayHeaderFontWeight: '500' as const,
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 14,
  };

  return (
    <View style={styles.container}>
      <View style={styles.calendarContainer}>
        <Calendar
          theme={calendarTheme}
          markingType="multi-dot"
          markedDates={getMarkedDates()}
          onDayPress={handleDayPress}
          enableSwipeMonths
        />
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.overdue }]} />
            <Text style={styles.legendText}>Overdue</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.dueSoon }]} />
            <Text style={styles.legendText}>Due Soon</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.upcoming }]} />
            <Text style={styles.legendText}>Upcoming</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.tasksContainer}>
        <Text style={styles.sectionTitle}>
          {selectedDate === new Date().toISOString().split('T')[0]
            ? 'Due Today'
            : `Due on ${formatDate(new Date(selectedDate).getTime())}`}
        </Text>

        {selectedTasks.length > 0 ? (
          selectedTasks.map((task) => {
            const status = getTaskStatus(task);
            let statusColor = colors.upcoming;
            if (status === 'overdue') statusColor = colors.overdue;
            else if (status === 'due-soon') statusColor = colors.dueSoon;

            return (
              <TouchableOpacity
                key={task.id}
                style={styles.taskCard}
                onPress={() => handleTaskPress(task)}
              >
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <View style={styles.taskContent}>
                  <Text style={styles.taskName}>{task.name}</Text>
                  <Text style={styles.assetName}>{getAssetName(task.assetId)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No tasks due on this date</Text>
        )}
      </ScrollView>
    </View>
  );
}
