import React, { useState, useEffect, useCallback } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackScreenProps } from '../navigation/types';
import { InventoryItem, AssetClass } from '../types';
import { getInventoryItem, addInventoryItem, updateInventoryItem, getAssetClasses } from '../storage';
import { SPACING, FONT_SIZE } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';


const UNIT_OPTIONS = ['each', 'quarts', 'gallons', 'liters', 'ounces', 'pounds', 'filters', 'bottles', 'cans', 'boxes', 'feet', 'inches', 'rolls'];

type Props = RootStackScreenProps<'AddInventory'>;

export default function AddInventoryScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const itemId = route.params?.itemId;
  const isEditing = !!itemId;

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('each');
  const [reorderThreshold, setReorderThreshold] = useState('');
  const [amazonUrl, setAmazonUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [applicableCategories, setApplicableCategories] = useState<string[]>([]);
  const [assetClasses, setAssetClasses] = useState<AssetClass[]>([]);

  useEffect(() => {
    loadAssetClasses();
    if (itemId) {
      loadItem();
    }
  }, [itemId]);


  const loadAssetClasses = async () => {
    const classes = await getAssetClasses();
    setAssetClasses(classes.sort((a, b) => a.order - b.order));
  };

  const loadItem = async () => {
    if (!itemId) return;
    const item = await getInventoryItem(itemId);
    if (item) {
      setName(item.name);
      setBrand(item.brand || '');
      setPartNumber(item.partNumber || '');
      setQuantity(String(item.quantity));
      setUnit(item.unit);
      setReorderThreshold(item.reorderThreshold != null ? String(item.reorderThreshold) : '');
      setAmazonUrl(item.amazonUrl || '');
      setNotes(item.notes || '');
      setApplicableCategories(item.applicableCategories || []);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setApplicableCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getSearchQuery = () => {
    return [brand, name, partNumber].filter(Boolean).join(' ');
  };

  const handleSearchAmazon = () => {
    const query = getSearchQuery();
    if (query) {
      navigation.navigate('AmazonBrowser', {
        searchUrl: `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=plantwell01-20`,
        onSelectUrl: (url: string) => setAmazonUrl(url),
      });
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const now = Date.now();
      const item: InventoryItem = {
        id: itemId || `${now}-${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        brand: brand.trim() || undefined,
        partNumber: partNumber.trim() || undefined,
        quantity: qty,
        unit: unit.trim() || 'each',
        reorderThreshold: reorderThreshold ? parseInt(reorderThreshold, 10) : undefined,
        amazonUrl: amazonUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        applicableCategories: applicableCategories.length > 0 ? applicableCategories : undefined,
        createdAt: isEditing ? now : now,
        updatedAt: now,
      };

      if (isEditing) {
        const existing = await getInventoryItem(itemId!);
        if (existing) {
          item.createdAt = existing.createdAt;
          item.linkedAssetIds = existing.linkedAssetIds;
          item.linkedTaskIds = existing.linkedTaskIds;
        }
        await updateInventoryItem(item);
      } else {
        await addInventoryItem(item);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', `Failed to save item: ${error?.message || error}`);
      console.error('Error saving inventory item:', error);
    }
  };

  const inputStyle = [styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={[styles.label, { color: colors.text }]}>Name *</Text>
      <TextInput style={inputStyle} value={name} onChangeText={setName} placeholder="e.g. Motor Oil 5W-30" placeholderTextColor={colors.textSecondary} />

      <Text style={[styles.label, { color: colors.text }]}>Brand</Text>
      <TextInput style={inputStyle} value={brand} onChangeText={setBrand} placeholder="e.g. Mobil 1" placeholderTextColor={colors.textSecondary} />

      <Text style={[styles.label, { color: colors.text }]}>Part Number</Text>
      <TextInput style={inputStyle} value={partNumber} onChangeText={setPartNumber} placeholder="Optional" placeholderTextColor={colors.textSecondary} />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={[styles.label, { color: colors.text }]}>Quantity *</Text>
          <TextInput style={inputStyle} value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textSecondary} />
        </View>
        <View style={styles.halfField}>
          <Text style={[styles.label, { color: colors.text }]}>Unit</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitPicker} contentContainerStyle={styles.unitPickerContent}>
            {UNIT_OPTIONS.map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitOption, { borderColor: colors.border }, unit === u && { borderColor: colors.primary, backgroundColor: colors.primary + '20' }]}
                onPress={() => setUnit(u)}
              >
                <Text style={[styles.unitOptionText, { color: colors.textSecondary }, unit === u && { color: colors.primary, fontWeight: '600' }]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Amazon Link</Text>
      <Text style={[styles.sublabel, { color: colors.textSecondary }]}>Search Amazon or paste a link for quick reordering</Text>
      <View style={styles.amazonRow}>
        <TextInput style={[...inputStyle, styles.amazonInput]} value={amazonUrl} onChangeText={setAmazonUrl} placeholder="https://amazon.com/dp/..." placeholderTextColor={colors.textSecondary} autoCapitalize="none" keyboardType="url" />
        <TouchableOpacity style={[styles.amazonSearchButton, { backgroundColor: colors.primary }]} onPress={handleSearchAmazon}>
          <Ionicons name="search" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      {name.trim() && (
        <TouchableOpacity style={styles.amazonLink} onPress={handleSearchAmazon}>
          <Ionicons name="cart-outline" size={16} color={colors.primary} />
          <Text style={[styles.amazonLinkText, { color: colors.primary }]}>
            Search Amazon for "{getSearchQuery()}"
          </Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.label, { color: colors.text }]}>Low Stock Alert</Text>
      <Text style={[styles.sublabel, { color: colors.textSecondary }]}>Get notified when quantity falls to this level</Text>
      <TextInput style={[...inputStyle, styles.thresholdInput]} value={reorderThreshold} onChangeText={setReorderThreshold} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textSecondary} />

      <Text style={[styles.label, { color: colors.text }]}>Applicable Asset Types</Text>
      <Text style={[styles.sublabel, { color: colors.textSecondary }]}>Select which asset types can use this item</Text>
      <View style={styles.categoriesContainer}>
        {assetClasses.map((ac) => {
          const selected = applicableCategories.includes(ac.id);
          return (
            <TouchableOpacity
              key={ac.id}
              style={[styles.categoryChip, { borderColor: colors.border }, selected && { borderColor: colors.primary, backgroundColor: colors.primary + '20' }]}
              onPress={() => toggleCategory(ac.id)}
            >
              {selected && <Ionicons name="checkmark" size={14} color={colors.primary} style={{ marginRight: 4 }} />}
              <Text style={[styles.categoryChipText, { color: colors.textSecondary }, selected && { color: colors.primary, fontWeight: '600' }]}>{ac.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{isEditing ? 'Update Item' : 'Add Item'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl * 2 },
  label: { fontSize: FONT_SIZE.md, fontWeight: '600', marginBottom: SPACING.xs, marginTop: SPACING.lg },
  sublabel: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.sm },
  input: { borderRadius: 8, padding: SPACING.md, fontSize: FONT_SIZE.md, borderWidth: 1 },
  row: { flexDirection: 'row', gap: SPACING.md },
  halfField: { flex: 1 },
  unitPicker: { maxHeight: 44 },
  unitPickerContent: { gap: SPACING.xs },
  unitOption: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 20, borderWidth: 1 },
  unitOptionText: { fontSize: FONT_SIZE.sm },
  amazonRow: { flexDirection: 'row', gap: SPACING.sm },
  amazonInput: { flex: 1 },
  amazonSearchButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  amazonLink: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
  amazonLinkText: { fontSize: FONT_SIZE.sm, fontWeight: '500', marginLeft: SPACING.xs },
  thresholdInput: { width: 80 },
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 20, borderWidth: 1 },
  categoryChipText: { fontSize: FONT_SIZE.sm },
  buttonRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.xl },
  cancelButton: { flex: 1, padding: SPACING.md, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  cancelButtonText: { fontSize: FONT_SIZE.lg, fontWeight: '600' },
  saveButton: { flex: 1, padding: SPACING.md, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: FONT_SIZE.lg, fontWeight: '700' },
});
