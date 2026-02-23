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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MainTabScreenProps } from '../navigation/types';
import { InventoryItem } from '../types';
import { getInventory } from '../storage';
import { isLowStock } from '../utils/notifications';
import { SPACING, FONT_SIZE } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';
import { useTutorial } from '../context/TutorialContext';

type Props = MainTabScreenProps<'Inventory'>;

export default function InventoryScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { showTutorial } = useTutorial();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [hasShownTutorial, setHasShownTutorial] = useState(false);

  const loadData = useCallback(async () => {
    const loaded = await getInventory();
    setItems(loaded.sort((a, b) => b.updatedAt - a.updatedAt));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  React.useEffect(() => {
    if (items.length === 0 && !hasShownTutorial) {
      setHasShownTutorial(true);
      showTutorial('inventory_add');
    }
  }, [items.length, hasShownTutorial, showTutorial]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const lowStock = isLowStock(item);
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => navigation.navigate('InventoryDetail', { itemId: item.id })}
      >
        <View style={styles.cardContent}>
          <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          {(item.brand || item.partNumber) && (
            <Text style={[styles.itemDetail, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.brand || ''}{item.brand && item.partNumber ? '\n' : ''}{item.partNumber ? `Part #: ${item.partNumber}` : ''}
            </Text>
          )}
        </View>
        <View style={styles.quantityContainer}>
          <Text style={[styles.quantityNumber, { color: lowStock ? colors.warning : colors.primary }]}>
            {item.quantity}
          </Text>
          <Text style={[styles.quantityUnit, { color: colors.textSecondary }]}>{item.unit}</Text>
          {lowStock && (
            <View style={styles.lowBadge}>
              <Text style={styles.lowBadgeText}>Low</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Inventory Items</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Track your maintenance supplies like oil, filters, and parts. Tap + to add an item.
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(SPACING.lg, insets.bottom + SPACING.md) }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('AddInventory');
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: SPACING.md },
  emptyContainer: { flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
  cardContent: { flex: 1 },
  itemName: { fontSize: FONT_SIZE.lg, fontWeight: '600' },
  itemDetail: { fontSize: FONT_SIZE.sm, marginTop: 2 },
  quantityContainer: { alignItems: 'flex-end', marginLeft: SPACING.md },
  quantityNumber: { fontSize: 28, fontWeight: '700' },
  quantityUnit: { fontSize: FONT_SIZE.sm },
  lowBadge: { backgroundColor: '#F87171', borderRadius: 10, paddingHorizontal: SPACING.sm, paddingVertical: 2, marginTop: 4 },
  lowBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '600', marginBottom: SPACING.sm },
  emptyText: { fontSize: FONT_SIZE.md, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FE7E02',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: { fontSize: 28, fontWeight: '400', color: '#FFFFFF', marginTop: -2 },
});
