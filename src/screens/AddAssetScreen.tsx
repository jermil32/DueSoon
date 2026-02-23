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
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { RootStackScreenProps } from '../navigation/types';
import { Asset, AssetCategory, AssetClass } from '../types';
import { addAsset, getAssets, updateAsset, getAssetClasses } from '../storage';
import { COLORS, SPACING, FONT_SIZE } from '../utils/constants';
import { usePremium, FREE_ASSET_LIMIT } from '../context/PremiumContext';

type Props = RootStackScreenProps<'AddAsset'>;

// Helper to determine category type for form rendering based on category ID or icon
const getCategoryType = (category: string, icon?: string): 'vehicle' | 'home' | 'pet' | 'money' | 'garden' | 'other' => {
  const vehicleCategories = ['car', 'tractor', 'atv', 'lawnmower', 'boat', 'motorcycle', 'truck', 'rv', 'snowmobile', 'airplane', 'bicycle'];
  const petCategories = ['pets', 'livestock'];
  const moneyCategories = ['dollar', 'money', 'bills'];
  const gardenCategories = ['garden'];
  const homeCategories = ['home'];

  // Check by icon first (for custom categories)
  if (icon) {
    if (petCategories.includes(icon)) return 'pet';
    if (moneyCategories.includes(icon)) return 'money';
    if (gardenCategories.includes(icon)) return 'garden';
    if (homeCategories.includes(icon)) return 'home';
    if (vehicleCategories.includes(icon)) return 'vehicle';
  }

  // Then check by category ID
  if (vehicleCategories.includes(category)) return 'vehicle';
  if (petCategories.includes(category)) return 'pet';
  if (moneyCategories.includes(category)) return 'money';
  if (gardenCategories.includes(category)) return 'garden';
  if (homeCategories.includes(category)) return 'home';
  return 'other';
};

export default function AddAssetScreen({ navigation, route }: Props) {
  const editingId = route.params?.assetId;
  const initialCategory = route.params?.category || 'car';
  const isEditing = !!editingId;
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { isPremium } = usePremium();

  // Common fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>(initialCategory);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [assetClasses, setAssetClasses] = useState<AssetClass[]>([]);

  // Vehicle-specific fields
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');

  // Pet-specific fields
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [weight, setWeight] = useState('');
  const [veterinarian, setVeterinarian] = useState('');
  const [microchipNumber, setMicrochipNumber] = useState('');

  // Home-specific fields
  const [address, setAddress] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');

  // Money/Bills-specific fields
  const [provider, setProvider] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [dueDay, setDueDay] = useState('');

  // Garden-specific fields
  const [plotSize, setPlotSize] = useState('');
  const [soilType, setSoilType] = useState('');

  // Get the icon for the current category to determine form type
  const currentAssetClass = assetClasses.find(c => c.id === category);
  const categoryType = getCategoryType(category, currentAssetClass?.icon);

  useEffect(() => {
    loadAssetClasses();
  }, []);

  useEffect(() => {
    if (editingId) {
      loadAsset();
    }
  }, [editingId]);

  const loadAssetClasses = async () => {
    const classes = await getAssetClasses();
    setAssetClasses(classes.sort((a, b) => a.order - b.order));
  };

  const loadAsset = async () => {
    const assets = await getAssets();
    const asset = assets.find((a) => a.id === editingId);
    if (asset) {
      setName(asset.name);
      setCategory(asset.category);
      setNotes(asset.notes || '');

      // Vehicle fields
      setMake(asset.make || '');
      setModel(asset.model || '');
      setYear(asset.year?.toString() || '');

      // Pet fields
      setSpecies(asset.species || '');
      setBreed(asset.breed || '');
      if (asset.dateOfBirth) {
        setDateOfBirth(new Date(asset.dateOfBirth));
      }
      setWeight(asset.weight || '');
      setVeterinarian(asset.veterinarian || '');
      setMicrochipNumber(asset.microchipNumber || '');

      // Home fields
      setAddress(asset.address || '');
      setSquareFootage(asset.squareFootage || '');
      setYearBuilt(asset.year?.toString() || '');

      // Money fields
      setProvider(asset.provider || '');
      setAccountNumber(asset.accountNumber || '');
      setDueDay(asset.dueDay?.toString() || '');

      // Garden fields
      setPlotSize(asset.plotSize || '');
      setSoilType(asset.soilType || '');
    }
  };

  const getCategoryLabel = (categoryId: string) => {
    const assetClass = assetClasses.find(c => c.id === categoryId);
    return assetClass?.label || categoryId;
  };

  useEffect(() => {
    if (assetClasses.length > 0) {
      const categoryLabel = getCategoryLabel(category);
      const title = isEditing
        ? `Edit ${categoryLabel}`
        : `Add ${categoryLabel}`;
      navigation.setOptions({ title });
    }
  }, [navigation, isEditing, category, assetClasses]);

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
        return { name: 'e.g., Lake House' };
      case 'boat':
        return { name: 'e.g., Bass Tracker', make: 'e.g., Tracker', model: 'e.g., Pro 175' };
      case 'pets':
      case 'livestock':
        return { name: 'e.g., Max', species: 'e.g., Dog', breed: 'e.g., Golden Retriever' };
      case 'dollar':
        return { name: 'e.g., Electric Bill', provider: 'e.g., City Power Co.' };
      case 'garden':
        return { name: 'e.g., Vegetable Garden', plotSize: 'e.g., 10x20 ft' };
      default:
        return { name: 'e.g., My Asset', make: 'e.g., Brand', model: 'e.g., Model' };
    }
  };

  const placeholder = getPlaceholder();

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for this asset');
      return;
    }

    setLoading(true);

    try {
      if (!isEditing && !isPremium) {
        const existingAssets = await getAssets();
        if (existingAssets.length >= FREE_ASSET_LIMIT) {
          setLoading(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Alert.alert(
            'Asset Limit Reached',
            `Free accounts can track up to ${FREE_ASSET_LIMIT} assets. Upgrade to Premium for unlimited assets.`,
            [
              { text: 'Maybe Later', style: 'cancel' },
              { text: 'Upgrade', onPress: () => navigation.navigate('Upgrade', { feature: 'Unlimited Assets' }) }
            ]
          );
          return;
        }
      }

      const now = Date.now();
      const newId = editingId || `${now}-${Math.random().toString(36).substr(2, 9)}`;

      const asset: Asset = {
        id: newId,
        name: name.trim(),
        category,
        notes: notes.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };

      // Add category-specific fields
      if (categoryType === 'vehicle' || categoryType === 'other') {
        asset.make = make.trim() || undefined;
        asset.model = model.trim() || undefined;
        asset.year = year ? parseInt(year, 10) : undefined;
      } else if (categoryType === 'pet') {
        asset.species = species.trim() || undefined;
        asset.breed = breed.trim() || undefined;
        asset.dateOfBirth = dateOfBirth?.getTime() || undefined;
        asset.weight = weight.trim() || undefined;
        asset.veterinarian = veterinarian.trim() || undefined;
        asset.microchipNumber = microchipNumber.trim() || undefined;
      } else if (categoryType === 'home') {
        asset.address = address.trim() || undefined;
        asset.squareFootage = squareFootage.trim() || undefined;
        asset.year = yearBuilt ? parseInt(yearBuilt, 10) : undefined;
      } else if (categoryType === 'money') {
        asset.provider = provider.trim() || undefined;
        asset.accountNumber = accountNumber.trim() || undefined;
        asset.dueDay = dueDay ? parseInt(dueDay, 10) : undefined;
      } else if (categoryType === 'garden') {
        asset.plotSize = plotSize.trim() || undefined;
        asset.soilType = soilType.trim() || undefined;
      }

      if (isEditing) {
        await updateAsset(asset);
      } else {
        await addAsset(asset);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error: any) {
      console.error('Save error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', `Failed to save: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const renderVehicleFields = () => (
    <>
      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Make</Text>
          <TextInput
            style={styles.input}
            value={make}
            onChangeText={setMake}
            placeholder={placeholder.make || 'e.g., Brand'}
            placeholderTextColor={COLORS.textLight}
          />
        </View>
        <View style={[styles.field, { flex: 1, marginLeft: SPACING.md }]}>
          <Text style={styles.label}>Model</Text>
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder={placeholder.model || 'e.g., Model'}
            placeholderTextColor={COLORS.textLight}
          />
        </View>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Year</Text>
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
    </>
  );

  const renderPetFields = () => (
    <>
      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Species</Text>
          <TextInput
            style={styles.input}
            value={species}
            onChangeText={setSpecies}
            placeholder={placeholder.species || 'e.g., Dog'}
            placeholderTextColor={COLORS.textLight}
          />
        </View>
        <View style={[styles.field, { flex: 1, marginLeft: SPACING.md }]}>
          <Text style={styles.label}>Breed</Text>
          <TextInput
            style={styles.input}
            value={breed}
            onChangeText={setBreed}
            placeholder={placeholder.breed || 'e.g., Labrador'}
            placeholderTextColor={COLORS.textLight}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Date of Birth</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={dateOfBirth ? styles.inputText : styles.placeholderText}>
              {dateOfBirth ? formatDate(dateOfBirth) : 'Select date'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>
        <View style={[styles.field, { flex: 1, marginLeft: SPACING.md }]}>
          <Text style={styles.label}>Weight</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="e.g., 65 lbs"
            placeholderTextColor={COLORS.textLight}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Veterinarian</Text>
        <TextInput
          style={styles.input}
          value={veterinarian}
          onChangeText={setVeterinarian}
          placeholder="e.g., Dr. Smith, City Vet Clinic"
          placeholderTextColor={COLORS.textLight}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Microchip Number</Text>
        <TextInput
          style={styles.input}
          value={microchipNumber}
          onChangeText={setMicrochipNumber}
          placeholder="e.g., 985112000123456"
          placeholderTextColor={COLORS.textLight}
        />
      </View>
    </>
  );

  const renderHomeFields = () => (
    <>
      <View style={styles.field}>
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="e.g., 123 Main Street"
          placeholderTextColor={COLORS.textLight}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Year Built</Text>
          <TextInput
            style={styles.input}
            value={yearBuilt}
            onChangeText={setYearBuilt}
            placeholder="e.g., 1985"
            placeholderTextColor={COLORS.textLight}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>
        <View style={[styles.field, { flex: 1, marginLeft: SPACING.md }]}>
          <Text style={styles.label}>Square Footage</Text>
          <TextInput
            style={styles.input}
            value={squareFootage}
            onChangeText={setSquareFootage}
            placeholder="e.g., 2,400"
            placeholderTextColor={COLORS.textLight}
            keyboardType="number-pad"
          />
        </View>
      </View>
    </>
  );

  const renderMoneyFields = () => (
    <>
      <View style={styles.field}>
        <Text style={styles.label}>Provider/Company</Text>
        <TextInput
          style={styles.input}
          value={provider}
          onChangeText={setProvider}
          placeholder={placeholder.provider || 'e.g., Electric Company'}
          placeholderTextColor={COLORS.textLight}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 2 }]}>
          <Text style={styles.label}>Account Number</Text>
          <TextInput
            style={styles.input}
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="e.g., 1234567890"
            placeholderTextColor={COLORS.textLight}
          />
        </View>
        <View style={[styles.field, { flex: 1, marginLeft: SPACING.md }]}>
          <Text style={styles.label}>Due Day</Text>
          <TextInput
            style={styles.input}
            value={dueDay}
            onChangeText={setDueDay}
            placeholder="e.g., 15"
            placeholderTextColor={COLORS.textLight}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
      </View>
    </>
  );

  const renderGardenFields = () => (
    <>
      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Plot Size</Text>
          <TextInput
            style={styles.input}
            value={plotSize}
            onChangeText={setPlotSize}
            placeholder={placeholder.plotSize || 'e.g., 10x20 ft'}
            placeholderTextColor={COLORS.textLight}
          />
        </View>
        <View style={[styles.field, { flex: 1, marginLeft: SPACING.md }]}>
          <Text style={styles.label}>Soil Type</Text>
          <TextInput
            style={styles.input}
            value={soilType}
            onChangeText={setSoilType}
            placeholder="e.g., Loamy"
            placeholderTextColor={COLORS.textLight}
          />
        </View>
      </View>
    </>
  );

  const renderCategorySpecificFields = () => {
    switch (categoryType) {
      case 'vehicle':
        return renderVehicleFields();
      case 'pet':
        return renderPetFields();
      case 'home':
        return renderHomeFields();
      case 'money':
        return renderMoneyFields();
      case 'garden':
        return renderGardenFields();
      case 'other':
        return renderVehicleFields(); // Default to vehicle-like fields
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Category selector - only show when editing */}
        {isEditing && assetClasses.length > 0 && (
          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryContainer}>
              {assetClasses.map((assetClass) => (
                <TouchableOpacity
                  key={assetClass.id}
                  style={[
                    styles.categoryButton,
                    category === assetClass.id && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(assetClass.id)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      category === assetClass.id && styles.categoryButtonTextActive,
                    ]}
                  >
                    {assetClass.label}
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

        {renderCategorySpecificFields()}

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

      <View style={[styles.footer, { paddingBottom: Math.max(SPACING.md, insets.bottom) }]}>
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
            {loading ? 'Saving...' : isEditing ? 'Save Changes' : `Add ${getCategoryLabel(category)}`}
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
  inputText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  placeholderText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
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
