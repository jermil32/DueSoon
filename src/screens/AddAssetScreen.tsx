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
import { Asset, AssetCategory } from '../types';
import { addAsset, getAssets, updateAsset } from '../storage';
import { COLORS, SPACING, FONT_SIZE, CATEGORY_LABELS, ASSET_CATEGORIES } from '../utils/constants';

type Props = RootStackScreenProps<'AddAsset'>;

export default function AddAssetScreen({ navigation, route }: Props) {
  const editingId = route.params?.assetId;
  const initialCategory = route.params?.category || 'car';
  const isEditing = !!editingId;

  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>(initialCategory);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingId) {
      loadAsset();
    }
  }, [editingId]);

  const loadAsset = async () => {
    const assets = await getAssets();
    const asset = assets.find((a) => a.id === editingId);
    if (asset) {
      setName(asset.name);
      setCategory(asset.category);
      setMake(asset.make || '');
      setModel(asset.model || '');
      setYear(asset.year?.toString() || '');
      setNotes(asset.notes || '');
    }
  };

  useEffect(() => {
    const title = isEditing
      ? `Edit ${CATEGORY_LABELS[category]}`
      : `Add ${CATEGORY_LABELS[category]}`;
    navigation.setOptions({ title });
  }, [navigation, isEditing, category]);

  const getPlaceholder = () => {
    switch (category) {
      case 'car':
        return { name: 'e.g., My Honda Accord', make: 'e.g., Honda', model: 'e.g., Accord' };
      case 'tractor':
        return { name: 'e.g., John Deere 5045E', make: 'e.g., John Deere', model: 'e.g., 5045E' };
      case 'atv':
        return { name: 'e.g., Polaris Sportsman', make: 'e.g., Polaris', model: 'e.g., Sportsman 570' };
      case 'lawnmower':
        return { name: 'e.g., Husqvarna Zero Turn', make: 'e.g., Husqvarna', model: 'e.g., Z254' };
      case 'home':
        return { name: 'e.g., Lake House', make: '', model: '' };
      case 'boat':
        return { name: 'e.g., Bass Tracker', make: 'e.g., Tracker', model: 'e.g., Pro 175' };
      default:
        return { name: 'e.g., My Asset', make: 'e.g., Brand', model: 'e.g., Model' };
    }
  };

  const placeholder = getPlaceholder();
  const showMakeModel = category !== 'home';

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for this asset');
      return;
    }

    setLoading(true);

    try {
      const now = Date.now();
      const newId = editingId || `${now}-${Math.random().toString(36).substr(2, 9)}`;

      const asset: Asset = {
        id: newId,
        name: name.trim(),
        category,
        make: make.trim() || undefined,
        model: model.trim() || undefined,
        year: year ? parseInt(year, 10) : undefined,
        notes: notes.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };

      if (isEditing) {
        await updateAsset(asset);
      } else {
        await addAsset(asset);
      }

      navigation.goBack();
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', `Failed to save: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Category selector - only show when editing */}
        {isEditing && (
          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryContainer}>
              {ASSET_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      category === cat && styles.categoryButtonTextActive,
                    ]}
                  >
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={placeholder.name}
            placeholderTextColor={COLORS.textLight}
            autoFocus={!isEditing}
          />
        </View>

        {showMakeModel && (
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Make</Text>
              <TextInput
                style={styles.input}
                value={make}
                onChangeText={setMake}
                placeholder={placeholder.make}
                placeholderTextColor={COLORS.textLight}
              />
            </View>
            <View style={[styles.field, { flex: 1, marginLeft: SPACING.md }]}>
              <Text style={styles.label}>Model</Text>
              <TextInput
                style={styles.input}
                value={model}
                onChangeText={setModel}
                placeholder={placeholder.model}
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>{category === 'home' ? 'Year Built' : 'Year'}</Text>
          <TextInput
            style={[styles.input, { width: 120 }]}
            value={year}
            onChangeText={setYear}
            placeholder="e.g., 2020"
            placeholderTextColor={COLORS.textLight}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional details..."
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={4}
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
            {loading ? 'Saving...' : isEditing ? 'Save Changes' : `Add ${CATEGORY_LABELS[category]}`}
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  categoryButtonTextActive: {
    color: COLORS.surface,
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
