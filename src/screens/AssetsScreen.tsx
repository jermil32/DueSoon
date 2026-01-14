import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { MainTabScreenProps } from '../navigation/types';
import { Asset, AssetCategory, IconOption } from '../types';
import { getAssets, getSettings } from '../storage';
import { LIGHT_COLORS as COLORS, SPACING, FONT_SIZE, CATEGORY_LABELS, ASSET_CATEGORIES, DEFAULT_CATEGORY_ICONS } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';
import * as Haptics from 'expo-haptics';

type Props = MainTabScreenProps<'Assets'>;

// Custom icon components - matching reference style with filled silhouettes
function CarIcon({ size, color, bgColor = 'white' }: { size: number; color: string; bgColor?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* SUV body - filled silhouette */}
      <Path
        d="M2 28 L2 22 L6 22 L10 14 L30 14 L34 22 L38 22 L38 28 L34 28 C34 28 33 24 30 24 C27 24 26 28 26 28 L14 28 C14 28 13 24 10 24 C7 24 6 28 6 28 L2 28"
        fill={color}
      />
      {/* Rear wheel - white center */}
      <Circle cx="10" cy="28" r="5" fill={color} />
      <Circle cx="10" cy="28" r="2.5" fill={bgColor} />
      {/* Front wheel - white center */}
      <Circle cx="30" cy="28" r="5" fill={color} />
      <Circle cx="30" cy="28" r="2.5" fill={bgColor} />
      {/* Windows */}
      <Path d="M12 22 L14 16 L18 16 L18 22 Z" fill={bgColor} />
      <Path d="M20 22 L20 16 L28 16 L30 22 Z" fill={bgColor} />
    </Svg>
  );
}

function TractorIcon({ size, color, bgColor = 'white' }: { size: number; color: string; bgColor?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* Main body */}
      <Path
        d="M18 28 L18 14 L24 10 L26 10 L26 14 L36 14 L36 24 L32 24 L32 28"
        fill={color}
      />
      {/* Hood */}
      <Rect x="26" y="18" width="8" height="6" fill={color} />
      {/* Exhaust */}
      <Rect x="34" y="8" width="2" height="10" fill={color} />
      {/* Large rear wheel */}
      <Circle cx="12" cy="26" r="10" fill={color} />
      <Circle cx="12" cy="26" r="4" fill={bgColor} />
      <Circle cx="12" cy="26" r="2" fill={color} />
      {/* Small front wheel */}
      <Circle cx="32" cy="30" r="5" fill={color} />
      <Circle cx="32" cy="30" r="2" fill={bgColor} />
      {/* Cab window */}
      <Path d="M19 15 L23 12 L25 12 L25 15 Z" fill={bgColor} />
    </Svg>
  );
}

function MotorcycleIcon({ size, color, bgColor = 'white' }: { size: number; color: string; bgColor?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* Rear wheel */}
      <Circle cx="8" cy="28" r="7" fill={color} />
      <Circle cx="8" cy="28" r="3" fill={bgColor} />
      {/* Front wheel */}
      <Circle cx="32" cy="28" r="7" fill={color} />
      <Circle cx="32" cy="28" r="3" fill={bgColor} />
      {/* Frame and body */}
      <Path
        d="M8 28 L12 18 L24 16 L28 10 L32 10 L34 14 L32 21 L24 24 L14 24 L8 28"
        fill={color}
      />
      {/* Tank */}
      <Path d="M14 18 L22 16 L22 20 L14 22 Z" fill={color} />
      {/* Seat */}
      <Path d="M10 20 L18 18 L18 16 L12 17 Z" fill={color} />
      {/* Handlebars */}
      <Path d="M26 8 L28 10 L30 8" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Engine detail */}
      <Circle cx="16" cy="24" r="3" fill={bgColor} />
    </Svg>
  );
}

function RidingMowerIcon({ size, color, bgColor = 'white' }: { size: number; color: string; bgColor?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* Mowing deck */}
      <Path d="M2 30 L2 26 L4 26 L4 30 Z" fill={color} />
      <Path d="M4 28 L12 28 L12 26 L4 26 Z" fill={color} />
      {/* Main body */}
      <Path
        d="M12 30 L12 16 L28 16 L32 22 L32 30"
        fill={color}
      />
      {/* Seat */}
      <Path d="M14 16 L14 10 L18 8 L18 16 Z" fill={color} />
      {/* Steering column */}
      <Rect x="24" y="10" width="3" height="8" fill={color} />
      {/* Steering wheel */}
      <Circle cx="25.5" cy="10" r="3" fill={color} />
      <Circle cx="25.5" cy="10" r="1.5" fill={bgColor} />
      {/* Rear wheel */}
      <Circle cx="16" cy="30" r="6" fill={color} />
      <Circle cx="16" cy="30" r="2.5" fill={bgColor} />
      {/* Front wheel */}
      <Circle cx="30" cy="32" r="4" fill={color} />
      <Circle cx="30" cy="32" r="1.5" fill={bgColor} />
    </Svg>
  );
}

function HomeIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* House body */}
      <Path d="M6 18 L6 34 L34 34 L34 18 L20 6 Z" fill={color} />
      {/* Door */}
      <Rect x="16" y="22" width="8" height="12" fill="white" />
      {/* Window left */}
      <Rect x="9" y="22" width="5" height="5" fill="white" />
      {/* Window right */}
      <Rect x="26" y="22" width="5" height="5" fill="white" />
      {/* Chimney */}
      <Rect x="28" y="8" width="4" height="8" fill={color} />
    </Svg>
  );
}

function SailboatIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* Hull */}
      <Path d="M4 30 L8 36 L32 36 L36 30 Z" fill={color} />
      {/* Mast */}
      <Rect x="19" y="6" width="2" height="24" fill={color} />
      {/* Main sail */}
      <Path d="M21 8 L34 28 L21 28 Z" fill={color} />
      {/* Jib sail */}
      <Path d="M19 8 L6 24 L19 24 Z" fill={color} />
    </Svg>
  );
}

function AirplaneIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* Fuselage - angled like reference */}
      <Path
        d="M4 26 L8 22 L28 14 L34 10 L38 12 L36 16 L30 18 L14 26 Z"
        fill={color}
      />
      {/* Wings */}
      <Path d="M16 18 L24 6 L28 8 L22 18 Z" fill={color} />
      <Path d="M10 26 L16 32 L20 30 L14 26 Z" fill={color} />
      {/* Tail */}
      <Path d="M6 24 L4 20 L8 22 Z" fill={color} />
      {/* Propeller hint */}
      <Circle cx="37" cy="13" r="2" fill={color} />
    </Svg>
  );
}

function DollarIcon({ size, color, bgColor = 'white' }: { size: number; color: string; bgColor?: string }) {
  const strokeWidth = 3.5;
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* Dollar S curve - thick outline style like reference */}
      <Path
        d="M24 10 C24 10 26 8 20 8 C14 8 12 12 12 14 C12 18 16 19 20 20 C24 21 28 22 28 26 C28 30 24 32 20 32 C14 32 14 30 14 30"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Vertical line through */}
      <Line x1="20" y1="4" x2="20" y2="36" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

function PlantIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* Stem */}
      <Rect x="19" y="20" width="2" height="18" fill={color} />
      {/* Top leaf */}
      <Path d="M20 4 C20 4 28 6 28 14 C28 18 24 20 20 20 C16 20 12 18 12 14 C12 6 20 4 20 4" fill={color} />
      {/* Left leaf pair */}
      <Path d="M19 22 C19 22 8 18 8 24 C8 28 14 30 19 28" fill={color} />
      <Path d="M19 30 C19 30 8 26 8 32 C8 36 14 38 19 36" fill={color} />
      {/* Right leaf pair */}
      <Path d="M21 26 C21 26 32 22 32 28 C32 32 26 34 21 32" fill={color} />
    </Svg>
  );
}

function ToolsIcon({ size, color, bgColor = 'white' }: { size: number; color: string; bgColor?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* Wrench 1 - from bottom-left to top-right */}
      <Path
        d="M6 34 L4 32 L4 28 L8 24 L16 32 L12 36 L8 36 Z"
        fill={color}
      />
      <Rect x="10" y="14" width="4" height="16" transform="rotate(-45 12 22)" fill={color} />
      <Path
        d="M24 10 L26 8 L30 8 L34 12 L34 16 L30 12 L26 16 L22 12 Z"
        fill={color}
      />
      {/* Wrench 2 - from bottom-right to top-left */}
      <Path
        d="M34 34 L36 32 L36 28 L32 24 L24 32 L28 36 L32 36 Z"
        fill={color}
      />
      <Rect x="20" y="14" width="4" height="16" transform="rotate(45 22 22)" fill={color} />
      <Path
        d="M16 10 L14 8 L10 8 L6 12 L6 16 L10 12 L14 16 L18 12 Z"
        fill={color}
      />
      {/* White center overlaps */}
      <Circle cx="20" cy="20" r="3" fill={bgColor} />
    </Svg>
  );
}

function TruckIcon({ size, color, bgColor = 'white' }: { size: number; color: string; bgColor?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* Truck body - pickup style */}
      <Path
        d="M2 28 L2 18 L18 18 L18 12 L28 12 L32 18 L38 18 L38 28 L34 28 C34 28 33 24 30 24 C27 24 26 28 26 28 L14 28 C14 28 13 24 10 24 C7 24 6 28 6 28 L2 28"
        fill={color}
      />
      {/* Bed */}
      <Path d="M2 18 L2 14 L16 14 L16 18 Z" fill={color} />
      {/* Rear wheel */}
      <Circle cx="10" cy="28" r="5" fill={color} />
      <Circle cx="10" cy="28" r="2.5" fill={bgColor} />
      {/* Front wheel */}
      <Circle cx="30" cy="28" r="5" fill={color} />
      <Circle cx="30" cy="28" r="2.5" fill={bgColor} />
      {/* Window */}
      <Path d="M20 18 L20 14 L26 14 L30 18 Z" fill={bgColor} />
    </Svg>
  );
}

function RVIcon({ size, color, bgColor = 'white' }: { size: number; color: string; bgColor?: string }) {
  const strokeWidth = 3;
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* Main body - outline style like reference camper */}
      <Path
        d="M4 30 L4 10 Q4 8 6 8 L34 8 Q36 8 36 10 L36 30"
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom line */}
      <Path d="M4 30 L10 30 M18 30 L36 30" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      {/* Left window */}
      <Rect x="7" y="12" width="8" height="8" rx="2" stroke={color} strokeWidth={strokeWidth} fill="none" />
      {/* Door */}
      <Path d="M20 30 L20 16 Q20 14 22 14 L26 14 Q28 14 28 16 L28 30" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Right window */}
      <Rect x="30" y="12" width="4" height="5" rx="1" stroke={color} strokeWidth={strokeWidth} fill="none" />
      {/* Wheel */}
      <Circle cx="14" cy="32" r="4" fill={color} />
      <Circle cx="14" cy="32" r="2" fill={bgColor} />
    </Svg>
  );
}

function SnowmobileIcon({ size, color, bgColor = 'white' }: { size: number; color: string; bgColor?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* Track base */}
      <Path d="M4 32 L36 32 Q38 32 38 30 L38 28 Q38 26 36 26 L4 26 Q2 26 2 28 L2 30 Q2 32 4 32" fill={color} />
      {/* Body */}
      <Path d="M6 26 L10 16 L28 16 L34 26 Z" fill={color} />
      {/* Seat */}
      <Path d="M12 16 L12 10 L20 10 L20 16 Z" fill={color} />
      {/* Windshield/handlebars */}
      <Path d="M22 16 L26 8 L30 8 L28 16 Z" fill={color} />
      {/* Track details */}
      <Rect x="6" y="28" width="2" height="2" fill={bgColor} />
      <Rect x="12" y="28" width="2" height="2" fill={bgColor} />
      <Rect x="18" y="28" width="2" height="2" fill={bgColor} />
      <Rect x="24" y="28" width="2" height="2" fill={bgColor} />
      <Rect x="30" y="28" width="2" height="2" fill={bgColor} />
      {/* Skis */}
      <Path d="M8 36 L2 36 L2 34 L8 34 L10 32" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Path d="M32 36 L38 36 L38 34 L32 34 L30 32" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function GeneratorIcon({ size, color, bgColor = 'white' }: { size: number; color: string; bgColor?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* Main body */}
      <Rect x="4" y="12" width="32" height="20" rx="2" fill={color} />
      {/* Handle */}
      <Path d="M10 12 L10 6 L30 6 L30 12" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Vents/details */}
      <Rect x="8" y="16" width="12" height="2" fill={bgColor} />
      <Rect x="8" y="20" width="12" height="2" fill={bgColor} />
      <Rect x="8" y="24" width="12" height="2" fill={bgColor} />
      {/* Control panel */}
      <Circle cx="28" cy="18" r="3" fill={bgColor} />
      <Circle cx="28" cy="26" r="3" fill={bgColor} />
    </Svg>
  );
}

function BicycleIcon({ size, color, bgColor = 'white' }: { size: number; color: string; bgColor?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* Rear wheel */}
      <Circle cx="10" cy="26" r="7" fill={color} />
      <Circle cx="10" cy="26" r="3" fill={bgColor} />
      {/* Front wheel */}
      <Circle cx="30" cy="26" r="7" fill={color} />
      <Circle cx="30" cy="26" r="3" fill={bgColor} />
      {/* Frame */}
      <Path d="M10 26 L18 14 L30 26 L22 26 L18 14" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 26 L22 26" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Seat post and seat */}
      <Line x1="16" y1="14" x2="14" y2="8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="16" y2="8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Handlebars */}
      <Line x1="18" y1="14" x2="20" y2="10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="18" y1="10" x2="22" y2="10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

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

// Icon component that renders based on IconOption
function CategoryIcon({ icon, size = 40, color = COLORS.text }: { icon: IconOption; size?: number; color?: string }) {
  // Use image icons if available
  if (iconImages[icon]) {
    return (
      <Image
        source={iconImages[icon]}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    );
  }

  // Fallback to SVG icons for missing images
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
  category: AssetCategory;
  count: number;
}

export default function AssetsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [customLabels, setCustomLabels] = useState<Record<AssetCategory, string>>(CATEGORY_LABELS);
  const [customIcons, setCustomIcons] = useState<Record<AssetCategory, IconOption>>(DEFAULT_CATEGORY_ICONS);

  const loadData = useCallback(async () => {
    const [loadedAssets, settings] = await Promise.all([
      getAssets(),
      getSettings(),
    ]);
    setAssets(loadedAssets);
    if (settings.customCategoryLabels) {
      setCustomLabels({ ...CATEGORY_LABELS, ...settings.customCategoryLabels });
    }
    if (settings.customCategoryIcons) {
      setCustomIcons({ ...DEFAULT_CATEGORY_ICONS, ...settings.customCategoryIcons });
    }
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

  // Get asset count per category
  const getCategoryData = (): CategoryData[] => {
    return ASSET_CATEGORIES.map((category) => ({
      category,
      count: assets.filter((a) => a.category === category).length,
    }));
  };

  const categoryData = getCategoryData();

  const renderCategoryItem = ({ item }: { item: CategoryData }) => {
    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => navigation.navigate('AssetsByCategory', { category: item.category })}
      >
        <View style={styles.categoryIcon}>
          <CategoryIcon icon={customIcons[item.category]} size={36} color={COLORS.text} />
        </View>
        <View style={styles.categoryContent}>
          <Text style={styles.categoryName}>{customLabels[item.category]}</Text>
          <Text style={styles.assetCount}>
            {item.count} {item.count === 1 ? 'asset' : 'assets'}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={categoryData}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.category}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.background,
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
    color: COLORS.text,
  },
  assetCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
});
