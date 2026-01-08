import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MainTabScreenProps } from '../navigation/types';
import { MaintenanceTask, Asset, AssetCategory } from '../types';
import { getAssets, getTasks } from '../storage';
import { sortTasksByUrgency, getTaskStatus, getDaysUntilDue } from '../utils/dates';
import { COLORS, SPACING, FONT_SIZE, CATEGORY_LABELS, ASSET_CATEGORIES } from '../utils/constants';

type Props = MainTabScreenProps<'Home'>;

// Minimalist SVG-style icons as text components
function AssetIcon({ category, size = 32 }: { category: AssetCategory; size?: number }) {
  const iconColor = COLORS.text;

  const icons: Record<AssetCategory, React.ReactNode> = {
    car: (
      <View style={[styles.iconContainer, { width: size, height: size }]}>
        <View style={[styles.carBody, { borderColor: iconColor }]} />
        <View style={[styles.carRoof, { borderColor: iconColor }]} />
        <View style={[styles.carWheel, styles.carWheelLeft, { backgroundColor: iconColor }]} />
        <View style={[styles.carWheel, styles.carWheelRight, { backgroundColor: iconColor }]} />
      </View>
    ),
    tractor: (
      <View style={[styles.iconContainer, { width: size, height: size }]}>
        <View style={[styles.tractorBody, { borderColor: iconColor }]} />
        <View style={[styles.tractorCab, { borderColor: iconColor }]} />
        <View style={[styles.tractorWheelBig, { borderColor: iconColor }]} />
        <View style={[styles.tractorWheelSmall, { borderColor: iconColor }]} />
      </View>
    ),
    atv: (
      <View style={[styles.iconContainer, { width: size, height: size }]}>
        <View style={[styles.atvBody, { borderColor: iconColor }]} />
        <View style={[styles.atvHandle, { backgroundColor: iconColor }]} />
        <View style={[styles.atvWheel, styles.atvWheelLeft, { borderColor: iconColor }]} />
        <View style={[styles.atvWheel, styles.atvWheelRight, { borderColor: iconColor }]} />
      </View>
    ),
    lawnmower: (
      <View style={[styles.iconContainer, { width: size, height: size }]}>
        <View style={[styles.mowerBody, { borderColor: iconColor }]} />
        <View style={[styles.mowerHandle, { backgroundColor: iconColor }]} />
        <View style={[styles.mowerWheel, styles.mowerWheelLeft, { backgroundColor: iconColor }]} />
        <View style={[styles.mowerWheel, styles.mowerWheelRight, { backgroundColor: iconColor }]} />
      </View>
    ),
    home: (
      <View style={[styles.iconContainer, { width: size, height: size }]}>
        <View style={[styles.homeRoof, { borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: iconColor }]} />
        <View style={[styles.homeBody, { borderColor: iconColor }]} />
        <View style={[styles.homeDoor, { backgroundColor: iconColor }]} />
      </View>
    ),
    boat: (
      <View style={[styles.iconContainer, { width: size, height: size }]}>
        <View style={[styles.boatHull, { borderColor: iconColor }]} />
        <View style={[styles.boatMast, { backgroundColor: iconColor }]} />
        <View style={[styles.boatSail, { borderLeftColor: iconColor, borderTopColor: 'transparent', borderBottomColor: 'transparent' }]} />
      </View>
    ),
  };

  return icons[category] || null;
}

export default function HomeScreen({ navigation }: Props) {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [loadedAssets, loadedTasks] = await Promise.all([getAssets(), getTasks()]);
    setAssets(loadedAssets);
    setTasks(sortTasksByUrgency(loadedTasks));
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

  const getAssetName = (assetId: string) => {
    return assets.find((a) => a.id === assetId)?.name || 'Unknown Asset';
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
    if (!task.nextDue) return 'No due date set';
    const days = getDaysUntilDue(task.nextDue);
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Tomorrow';
    return `${days}d`;
  };

  const urgentTasks = tasks.filter((t) => {
    const status = getTaskStatus(t);
    return status === 'overdue' || status === 'due-soon';
  });

  const handleCategoryPress = (category: AssetCategory) => {
    navigation.navigate('AddAsset', { category });
  };

  return (
    <View style={styles.container}>
      {/* Top 2/3 - Tasks and Status */}
      <ScrollView
        style={styles.topSection}
        contentContainerStyle={styles.topContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {urgentTasks.length > 0 ? (
          <View style={styles.tasksSection}>
            <Text style={styles.sectionTitle}>Needs Attention</Text>
            {urgentTasks.slice(0, 5).map((task) => {
              const status = getTaskStatus(task);
              return (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskCard}
                  onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
                >
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                  <View style={styles.taskContent}>
                    <Text style={styles.taskName} numberOfLines={1}>{task.name}</Text>
                    <Text style={styles.assetName} numberOfLines={1}>{getAssetName(task.assetId)}</Text>
                  </View>
                  <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                    {getStatusText(task)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : assets.length > 0 ? (
          <View style={styles.allGoodSection}>
            <Text style={styles.allGoodIcon}>✓</Text>
            <Text style={styles.allGoodTitle}>All caught up!</Text>
            <Text style={styles.allGoodText}>No maintenance due soon</Text>
          </View>
        ) : (
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome to DueSoon</Text>
            <Text style={styles.welcomeText}>
              Track maintenance for all your vehicles, equipment, and property.
            </Text>
            <Text style={styles.welcomeHint}>
              Select an asset type below to get started
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom 1/3 - Asset Type Buttons */}
      <View style={styles.bottomSection}>
        <Text style={styles.addAssetTitle}>Add New Asset</Text>
        <View style={styles.categoryGrid}>
          {ASSET_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={styles.categoryButton}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryIconWrapper}>
                <AssetIcon category={category} size={36} />
              </View>
              <Text style={styles.categoryLabel}>{CATEGORY_LABELS[category]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topSection: {
    flex: 2,
  },
  topContent: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  tasksSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.md,
  },
  taskContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  taskName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  assetName: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  allGoodSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allGoodIcon: {
    fontSize: 48,
    color: COLORS.success,
    marginBottom: SPACING.sm,
  },
  allGoodTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.success,
  },
  allGoodText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  welcomeSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  welcomeTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  welcomeText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  welcomeHint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    marginTop: SPACING.lg,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  addAssetTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
  },
  categoryButton: {
    width: '30%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    marginBottom: SPACING.md,
  },
  categoryIconWrapper: {
    marginBottom: SPACING.xs,
  },
  categoryLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.text,
  },
  // Icon styles - Car
  iconContainer: {
    position: 'relative',
  },
  carBody: {
    position: 'absolute',
    bottom: 6,
    left: 2,
    right: 2,
    height: 10,
    borderWidth: 2,
    borderRadius: 3,
  },
  carRoof: {
    position: 'absolute',
    bottom: 14,
    left: 8,
    right: 8,
    height: 8,
    borderWidth: 2,
    borderRadius: 2,
  },
  carWheel: {
    position: 'absolute',
    bottom: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  carWheelLeft: {
    left: 4,
  },
  carWheelRight: {
    right: 4,
  },
  // Icon styles - Tractor
  tractorBody: {
    position: 'absolute',
    bottom: 10,
    left: 4,
    width: 20,
    height: 10,
    borderWidth: 2,
    borderRadius: 2,
  },
  tractorCab: {
    position: 'absolute',
    bottom: 16,
    right: 6,
    width: 10,
    height: 10,
    borderWidth: 2,
    borderRadius: 2,
  },
  tractorWheelBig: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  tractorWheelSmall: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  // Icon styles - ATV
  atvBody: {
    position: 'absolute',
    bottom: 8,
    left: 6,
    right: 6,
    height: 8,
    borderWidth: 2,
    borderRadius: 2,
  },
  atvHandle: {
    position: 'absolute',
    bottom: 14,
    left: 10,
    right: 10,
    height: 3,
    borderRadius: 1,
  },
  atvWheel: {
    position: 'absolute',
    bottom: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  atvWheelLeft: {
    left: 2,
  },
  atvWheelRight: {
    right: 2,
  },
  // Icon styles - Lawnmower
  mowerBody: {
    position: 'absolute',
    bottom: 8,
    left: 4,
    right: 8,
    height: 10,
    borderWidth: 2,
    borderRadius: 3,
  },
  mowerHandle: {
    position: 'absolute',
    bottom: 16,
    right: 6,
    width: 3,
    height: 14,
    borderRadius: 1,
    transform: [{ rotate: '-20deg' }],
  },
  mowerWheel: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mowerWheelLeft: {
    left: 4,
  },
  mowerWheelRight: {
    right: 10,
  },
  // Icon styles - Home
  homeRoof: {
    position: 'absolute',
    top: 4,
    left: 2,
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 10,
  },
  homeBody: {
    position: 'absolute',
    bottom: 4,
    left: 6,
    right: 6,
    height: 14,
    borderWidth: 2,
  },
  homeDoor: {
    position: 'absolute',
    bottom: 4,
    left: 13,
    width: 6,
    height: 10,
  },
  // Icon styles - Boat
  boatHull: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    height: 8,
    borderWidth: 2,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  boatMast: {
    position: 'absolute',
    bottom: 10,
    left: 14,
    width: 2,
    height: 18,
  },
  boatSail: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderTopWidth: 7,
    borderBottomWidth: 7,
  },
});
