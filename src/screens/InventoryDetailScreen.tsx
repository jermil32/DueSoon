import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackScreenProps } from '../navigation/types';
import { InventoryItem } from '../types';
import { getInventoryItem, deleteInventoryItem, updateInventoryQuantity } from '../storage';
import { isLowStock } from '../utils/notifications';
import { SPACING, FONT_SIZE } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';
import { getAmazonUrl } from '../utils/amazon';

type Props = RootStackScreenProps<'InventoryDetail'>;

export default function InventoryDetailScreen({ navigation, route }: Props) {
  const { itemId } = route.params;
  const { colors } = useTheme();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const loaded = await getInventoryItem(itemId);
    setItem(loaded);
    if (loaded) {
      navigation.setOptions({ title: loaded.name });
    }
  }, [itemId, navigation]);

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

  const handleAdjustQuantity = async (delta: number) => {
    if (!item) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateInventoryQuantity(item.id, delta);
    await loadData();
  };

  const handleDelete = () => {
    if (!item) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteInventoryItem(item.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
      </View>
    );
  }

  const lowStock = isLowStock(item);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
        {item.brand && <Text style={[styles.detail, { color: colors.textSecondary }]}>{item.brand}</Text>}
        {item.partNumber && <Text style={[styles.detail, { color: colors.textSecondary }]}>Part #{item.partNumber}</Text>}
      </View>

      <View style={[styles.quantitySection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>QUANTITY</Text>
        <View style={styles.quantityRow}>
          <TouchableOpacity style={[styles.quantityButton, { backgroundColor: colors.background }]} onPress={() => handleAdjustQuantity(-1)}>
            <Ionicons name="remove" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.quantityDisplay}>
            <Text
              style={[styles.quantityValue, lowStock && { color: colors.warning }]}
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              {item.quantity}
            </Text>
            <Text style={[styles.quantityUnit, { color: colors.textSecondary }]} numberOfLines={1}>{item.unit}</Text>
          </View>
          <TouchableOpacity style={[styles.quantityButton, { backgroundColor: colors.background }]} onPress={() => handleAdjustQuantity(1)}>
            <Ionicons name="add" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        {lowStock && (
          <Text style={[styles.lowStockWarning, { color: colors.warning }]}>
            Below reorder threshold ({item.reorderThreshold})
          </Text>
        )}
      </View>

      {item.notes && (
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>NOTES</Text>
          <Text style={[styles.notesText, { color: colors.text }]}>{item.notes}</Text>
        </View>
      )}

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.amazonButton, { backgroundColor: '#FF9900' }]}
          onPress={() => Linking.openURL(getAmazonUrl(item))}
        >
          <Ionicons name="cart-outline" size={20} color="#FFFFFF" style={{ marginRight: SPACING.sm }} />
          <Text style={styles.amazonButtonText}>
            {item.amazonUrl ? 'Buy on Amazon' : 'Search on Amazon'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.actions, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddInventory', { itemId: item.id })}
        >
          <Text style={styles.editButtonText}>Edit Item</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.deleteButton, { borderColor: colors.danger }]} onPress={handleDelete}>
          <Text style={[styles.deleteButtonText, { color: colors.danger }]}>Delete Item</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingText: { textAlign: 'center', marginTop: SPACING.xl },
  header: { padding: SPACING.lg, alignItems: 'center' },
  itemName: { fontSize: FONT_SIZE.xxl, fontWeight: '700' },
  detail: { fontSize: FONT_SIZE.md, marginTop: SPACING.xs },
  quantitySection: { marginTop: SPACING.md, padding: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZE.sm, fontWeight: '600', textTransform: 'uppercase', marginBottom: SPACING.md },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  quantityButton: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  quantityDisplay: { alignItems: 'center', marginHorizontal: SPACING.xl, flexShrink: 1, maxWidth: '60%' },
  quantityValue: { fontSize: 48, fontWeight: '700', textAlign: 'center' },
  quantityUnit: { fontSize: FONT_SIZE.md, marginTop: SPACING.xs, textAlign: 'center' },
  lowStockWarning: { textAlign: 'center', fontSize: FONT_SIZE.sm, fontWeight: '600', marginTop: SPACING.md },
  section: { marginTop: SPACING.md, padding: SPACING.lg },
  notesText: { fontSize: FONT_SIZE.md, lineHeight: 22 },
  actions: { marginTop: SPACING.md, padding: SPACING.lg, gap: SPACING.sm },
  editButton: { padding: SPACING.md, borderRadius: 8, alignItems: 'center' },
  editButtonText: { color: '#FFFFFF', fontSize: FONT_SIZE.lg, fontWeight: '600' },
  deleteButton: { padding: SPACING.md, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  amazonButton: { flexDirection: 'row', padding: SPACING.md, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  amazonButtonText: { color: '#FFFFFF', fontSize: FONT_SIZE.lg, fontWeight: '600' },
  deleteButtonText: { fontSize: FONT_SIZE.lg, fontWeight: '600' },
});
