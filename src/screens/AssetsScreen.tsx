import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { MainTabScreenProps } from '../navigation/types';
import { Asset, AssetClass, IconOption } from '../types';
import { getAssets, getAssetClasses, saveAssetClasses } from '../storage';
import { LIGHT_COLORS as COLORS, SPACING, FONT_SIZE, ICON_OPTIONS, DEFAULT_ASSET_CLASSES } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';
import { useTutorial } from '../context/TutorialContext';
import * as Haptics from 'expo-haptics';

type Props = MainTabScreenProps<'Assets'>;

// Image icon sources
const iconImages: Partial<Record<IconOption, any>> = {
  car: require('../../assets/icons/car.png'),
  tractor: require('../../assets/icons/tractor.png'),
  atv: require('../../assets/icons/atv.png'),
  motorcycle: require('../../assets/icons/motorcycle.png'),
  lawnmower: require('../../assets/icons/lawnmower.png'),
  airplane: require('../../assets/icons/airplane.png'),
  dollar: require('../../assets/icons/dollar.png'),
  garden: require('../../assets/icons/plant.png'),
  tools: require('../../assets/icons/tools.png'),
  rv: require('../../assets/icons/rv.png'),
  truck: require('../../assets/icons/truck.png'),
  boat: require('../../assets/icons/boat.png'),
  home: require('../../assets/icons/home.png'),
  bicycle: require('../../assets/icons/bicycle.png'),
  snowmobile: require('../../assets/icons/snowmobile.png'),
  livestock: require('../../assets/icons/livestock.png'),
  pets: require('../../assets/icons/pets.png'),
};

// SVG Icon fallbacks
function HomeIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path d="M6 18 L6 34 L34 34 L34 18 L20 6 Z" fill={color} />
      <Rect x="16" y="22" width="8" height="12" fill="white" />
      <Rect x="9" y="22" width="5" height="5" fill="white" />
      <Rect x="26" y="22" width="5" height="5" fill="white" />
      <Rect x="28" y="8" width="4" height="8" fill={color} />
    </Svg>
  );
}

function SailboatIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path d="M4 30 L8 36 L32 36 L36 30 Z" fill={color} />
      <Rect x="19" y="6" width="2" height="24" fill={color} />
      <Path d="M21 8 L34 28 L21 28 Z" fill={color} />
      <Path d="M19 8 L6 24 L19 24 Z" fill={color} />
    </Svg>
  );
}

function BicycleIcon({ size, color, bgColor = 'white' }: { size: number; color: string; bgColor?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx="10" cy="26" r="7" fill={color} />
      <Circle cx="10" cy="26" r="3" fill={bgColor} />
      <Circle cx="30" cy="26" r="7" fill={color} />
      <Circle cx="30" cy="26" r="3" fill={bgColor} />
      <Path d="M10 26 L18 14 L30 26 L22 26 L18 14" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 26 L22 26" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Line x1="16" y1="14" x2="14" y2="8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="16" y2="8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="18" y1="14" x2="20" y2="10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="18" y1="10" x2="22" y2="10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function TruckIcon({ size, color, bgColor = 'white' }: { size: number; color: string; bgColor?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path
        d="M2 28 L2 18 L18 18 L18 12 L28 12 L32 18 L38 18 L38 28 L34 28 C34 28 33 24 30 24 C27 24 26 28 26 28 L14 28 C14 28 13 24 10 24 C7 24 6 28 6 28 L2 28"
        fill={color}
      />
      <Path d="M2 18 L2 14 L16 14 L16 18 Z" fill={color} />
      <Circle cx="10" cy="28" r="5" fill={color} />
      <Circle cx="10" cy="28" r="2.5" fill={bgColor} />
      <Circle cx="30" cy="28" r="5" fill={color} />
      <Circle cx="30" cy="28" r="2.5" fill={bgColor} />
      <Path d="M20 18 L20 14 L26 14 L30 18 Z" fill={bgColor} />
    </Svg>
  );
}

function SnowmobileIcon({ size, color, bgColor = 'white' }: { size: number; color: string; bgColor?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path d="M4 32 L36 32 Q38 32 38 30 L38 28 Q38 26 36 26 L4 26 Q2 26 2 28 L2 30 Q2 32 4 32" fill={color} />
      <Path d="M6 26 L10 16 L28 16 L34 26 Z" fill={color} />
      <Path d="M12 16 L12 10 L20 10 L20 16 Z" fill={color} />
      <Path d="M22 16 L26 8 L30 8 L28 16 Z" fill={color} />
      <Rect x="6" y="28" width="2" height="2" fill={bgColor} />
      <Rect x="12" y="28" width="2" height="2" fill={bgColor} />
      <Rect x="18" y="28" width="2" height="2" fill={bgColor} />
      <Rect x="24" y="28" width="2" height="2" fill={bgColor} />
      <Rect x="30" y="28" width="2" height="2" fill={bgColor} />
      <Path d="M8 36 L2 36 L2 34 L8 34 L10 32" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Path d="M32 36 L38 36 L38 34 L32 34 L30 32" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function GeneratorIcon({ size, color, bgColor = 'white' }: { size: number; color: string; bgColor?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Rect x="4" y="12" width="32" height="20" rx="2" fill={color} />
      <Path d="M10 12 L10 6 L30 6 L30 12" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="8" y="16" width="12" height="2" fill={bgColor} />
      <Rect x="8" y="20" width="12" height="2" fill={bgColor} />
      <Rect x="8" y="24" width="12" height="2" fill={bgColor} />
      <Circle cx="28" cy="18" r="3" fill={bgColor} />
      <Circle cx="28" cy="26" r="3" fill={bgColor} />
    </Svg>
  );
}

// Icon component that renders based on IconOption
function CategoryIcon({ icon, size = 40, color = COLORS.text }: { icon: IconOption; size?: number; color?: string }) {
  if (iconImages[icon]) {
    return (
      <Image
        source={iconImages[icon]}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    );
  }

  const svgIcons: Partial<Record<IconOption, React.ReactNode>> = {
    home: <HomeIcon size={size} color={color} />,
    boat: <SailboatIcon size={size} color={color} />,
    bicycle: <BicycleIcon size={size} color={color} />,
    truck: <TruckIcon size={size} color={color} />,
    snowmobile: <SnowmobileIcon size={size} color={color} />,
    generator: <GeneratorIcon size={size} color={color} />,
  };

  return <>{svgIcons[icon] || null}</>;
}

interface CategoryData {
  assetClass: AssetClass;
  count: number;
}

export default function AssetsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { showTutorial } = useTutorial();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetClasses, setAssetClasses] = useState<AssetClass[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState<AssetClass | null>(null);
  const [editLabelText, setEditLabelText] = useState('');
  const [editIconSelection, setEditIconSelection] = useState<IconOption>('car');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [hasShownEditTutorial, setHasShownEditTutorial] = useState(false);
  const [hasShownReorderTutorial, setHasShownReorderTutorial] = useState(false);

  // Move Edit button into navigation header instead of redundant custom header
  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={[styles.editButton, isEditing && { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsEditing(!isEditing);
          }}
        >
          <Text style={[styles.editButtonText, { color: isEditing ? '#FFFFFF' : colors.primary }]}>
            {isEditing ? 'Done' : 'Edit'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, isEditing, colors]);

  const loadData = useCallback(async () => {
    const [loadedAssets, loadedClasses] = await Promise.all([
      getAssets(),
      getAssetClasses(),
    ]);
    setAssets(loadedAssets);
    // Sort by order
    setAssetClasses(loadedClasses.sort((a, b) => a.order - b.order));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Show edit button tutorial on first visit
  React.useEffect(() => {
    if (assetClasses.length > 0 && !hasShownEditTutorial) {
      setHasShownEditTutorial(true);
      showTutorial('assets_edit_button');
    }
  }, [assetClasses.length, hasShownEditTutorial, showTutorial]);

  // Show reorder and separator tutorials when entering edit mode
  React.useEffect(() => {
    if (isEditing && !hasShownReorderTutorial) {
      setHasShownReorderTutorial(true);
      // Show reorder tutorial first, then separator will show after they dismiss it
      showTutorial('assets_reorder');
      // Show separator tutorial with a small delay so it appears after reorder is dismissed
      setTimeout(() => {
        showTutorial('assets_separator');
      }, 100);
    }
  }, [isEditing, hasShownReorderTutorial, showTutorial]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getCategoryData = (): CategoryData[] => {
    return assetClasses.map((assetClass) => ({
      assetClass,
      count: assets.filter((a) => a.category === assetClass.id).length,
    }));
  };

  const categoryData = getCategoryData();

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newClasses = [...assetClasses];
    const temp = newClasses[index - 1];
    newClasses[index - 1] = { ...newClasses[index], order: index - 1 };
    newClasses[index] = { ...temp, order: index };
    setAssetClasses(newClasses);
    await saveAssetClasses(newClasses);
  };

  const handleMoveDown = async (index: number) => {
    if (index === assetClasses.length - 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newClasses = [...assetClasses];
    const temp = newClasses[index + 1];
    newClasses[index + 1] = { ...newClasses[index], order: index + 1 };
    newClasses[index] = { ...temp, order: index };
    setAssetClasses(newClasses);
    await saveAssetClasses(newClasses);
  };

  const handleEditClass = (assetClass: AssetClass) => {
    setEditingClass(assetClass);
    setEditLabelText(assetClass.label);
    setEditIconSelection(assetClass.icon);
    setIsAddingNew(false);
    setEditModalVisible(true);
  };

  const handleAddClass = () => {
    setEditingClass(null);
    setEditLabelText('');
    setEditIconSelection('car');
    setIsAddingNew(true);
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    if (!editLabelText.trim()) {
      Alert.alert('Error', 'Please enter a label for the category');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isAddingNew) {
      const newClass: AssetClass = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        label: editLabelText.trim(),
        icon: editIconSelection,
        isBuiltIn: false,
        order: assetClasses.length,
      };
      const newClasses = [...assetClasses, newClass];
      setAssetClasses(newClasses);
      await saveAssetClasses(newClasses);
    } else if (editingClass) {
      const updatedClass = {
        ...editingClass,
        label: editLabelText.trim(),
        icon: editIconSelection,
      };
      const newClasses = assetClasses.map(c =>
        c.id === editingClass.id ? updatedClass : c
      );
      setAssetClasses(newClasses);
      await saveAssetClasses(newClasses);
    }

    handleCloseModal();
  };

  const handleDelete = async () => {
    if (!editingClass) return;

    const assetsUsingClass = assets.filter(a => a.category === editingClass.id);
    if (assetsUsingClass.length > 0) {
      Alert.alert(
        'Cannot Delete',
        `This category has ${assetsUsingClass.length} asset(s). Please delete or reassign them first.`
      );
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${editingClass.label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            const newClasses = assetClasses
              .filter(c => c.id !== editingClass.id)
              .map((c, index) => ({ ...c, order: index }));
            setAssetClasses(newClasses);
            await saveAssetClasses(newClasses);
            handleCloseModal();
          },
        },
      ]
    );
  };

  const handleReset = async () => {
    if (!editingClass || !editingClass.isBuiltIn) return;

    const defaultClass = DEFAULT_ASSET_CLASSES.find(c => c.id === editingClass.id);
    if (defaultClass) {
      setEditLabelText(defaultClass.label);
      setEditIconSelection(defaultClass.icon);
    }
  };

  const handleCloseModal = () => {
    setEditModalVisible(false);
    setShowIconPicker(false);
    setEditingClass(null);
    setEditLabelText('');
    setEditIconSelection('car');
    setIsAddingNew(false);
  };

  const renderCategoryItem = ({ item, index }: { item: CategoryData; index: number }) => {
    return (
      <View>
        {/* Orange separator line between 6th and 7th item */}
        {index === 6 && (
          <View style={styles.homescreenCutoffContainer}>
            <View style={styles.homescreenCutoffLine} />
            <Text style={styles.homescreenCutoffText}>Above shows on home</Text>
            <View style={styles.homescreenCutoffLine} />
          </View>
        )}
        <TouchableOpacity
          style={[styles.categoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            if (isEditing) {
              handleEditClass(item.assetClass);
            } else {
              navigation.navigate('AssetsByCategory', { category: item.assetClass.id });
            }
          }}
        >
          {isEditing && (
            <View style={styles.reorderButtons}>
              <TouchableOpacity
                style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
                onPress={() => handleMoveUp(index)}
                disabled={index === 0}
              >
                <Ionicons name="chevron-up" size={20} color={index === 0 ? colors.textLight : colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reorderButton, index === assetClasses.length - 1 && styles.reorderButtonDisabled]}
                onPress={() => handleMoveDown(index)}
                disabled={index === assetClasses.length - 1}
              >
                <Ionicons name="chevron-down" size={20} color={index === assetClasses.length - 1 ? colors.textLight : colors.text} />
              </TouchableOpacity>
            </View>
          )}
          <View style={[styles.categoryIcon, { backgroundColor: '#FFFFFF' }]}>
            <CategoryIcon icon={item.assetClass.icon} size={36} color={COLORS.text} />
          </View>
          <View style={styles.categoryContent}>
            <Text style={[styles.categoryName, { color: colors.text }]}>{item.assetClass.label}</Text>
            <Text style={[styles.assetCount, { color: colors.textSecondary }]}>
              {item.count} {item.count === 1 ? 'asset' : 'assets'}
            </Text>
          </View>
          {isEditing ? (
            <Ionicons name="pencil" size={20} color={colors.textSecondary} />
          ) : (
            <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={categoryData}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.assetClass.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={
          isEditing ? (
            <TouchableOpacity
              style={[styles.addCategoryButton, { borderColor: colors.primary }]}
              onPress={handleAddClass}
            >
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              <Text style={[styles.addCategoryText, { color: colors.primary }]}>Add Category</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Edit/Add Category Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isAddingNew ? 'Add Category' : 'Edit Category'}
            </Text>

            {/* Icon Selection */}
            <Text style={[styles.modalLabel, { color: colors.text }]}>Icon</Text>
            <TouchableOpacity
              style={[styles.iconSelector, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowIconPicker(!showIconPicker)}
            >
              <View style={styles.iconPreview}>
                <CategoryIcon icon={editIconSelection} size={32} color={COLORS.text} />
              </View>
              <Text style={[styles.iconSelectorText, { color: colors.text }]}>
                {ICON_OPTIONS.find(opt => opt.id === editIconSelection)?.label || 'Select Icon'}
              </Text>
              <Text style={[styles.changeText, { color: colors.primary }]}>
                {showIconPicker ? 'Close' : 'Change'}
              </Text>
            </TouchableOpacity>

            {showIconPicker && (
              <ScrollView style={styles.iconPickerContainer} horizontal={false}>
                <View style={styles.iconGrid}>
                  {ICON_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.iconOption,
                        { borderColor: colors.border },
                        editIconSelection === option.id && { borderColor: colors.primary, borderWidth: 2 },
                      ]}
                      onPress={() => {
                        setEditIconSelection(option.id);
                        setShowIconPicker(false);
                      }}
                    >
                      <CategoryIcon icon={option.id} size={28} color={COLORS.text} />
                      <Text style={[
                        styles.iconOptionLabel,
                        { color: colors.textSecondary },
                        editIconSelection === option.id && { color: colors.primary, fontWeight: '600' },
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            {/* Label Input */}
            <Text style={[styles.modalLabel, { color: colors.text }]}>Label</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={editLabelText}
              onChangeText={setEditLabelText}
              placeholder="Enter category name"
              placeholderTextColor={colors.textSecondary}
              selectTextOnFocus
            />

            <View style={styles.modalButtons}>
              {!isAddingNew && editingClass && !editingClass.isBuiltIn && (
                <TouchableOpacity
                  style={[styles.deleteButton]}
                  onPress={handleDelete}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
              {!isAddingNew && editingClass?.isBuiltIn && (
                <TouchableOpacity
                  style={styles.modalButtonSecondary}
                  onPress={handleReset}
                >
                  <Text style={[styles.modalButtonSecondaryText, { color: colors.textSecondary }]}>Reset</Text>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={handleCloseModal}
              >
                <Text style={[styles.modalButtonSecondaryText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Text style={styles.modalButtonPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  editButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  editButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.md,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
  reorderButtons: {
    marginRight: SPACING.sm,
  },
  reorderButton: {
    padding: SPACING.xs,
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
  homescreenCutoffContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  homescreenCutoffLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#FF6B00',
  },
  homescreenCutoffText: {
    color: '#FF6B00',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginHorizontal: SPACING.sm,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  assetCount: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    marginLeft: SPACING.sm,
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: SPACING.sm,
  },
  addCategoryText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    borderRadius: 16,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  modalInput: {
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  modalButtonPrimary: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  modalButtonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: FONT_SIZE.md,
  },
  modalButtonSecondary: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  modalButtonSecondaryText: {
    fontWeight: '500',
    fontSize: FONT_SIZE.md,
  },
  deleteButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#DC3545',
    fontWeight: '500',
    fontSize: FONT_SIZE.md,
  },
  iconSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  iconPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSelectorText: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: FONT_SIZE.md,
  },
  changeText: {
    fontSize: FONT_SIZE.sm,
  },
  iconPickerContainer: {
    maxHeight: 200,
    marginBottom: SPACING.md,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: SPACING.sm,
  },
  iconOption: {
    width: '22%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: SPACING.xs,
    backgroundColor: '#FFFFFF',
  },
  iconOptionLabel: {
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
});
