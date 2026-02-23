import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { TutorialStepId } from '../types';
import { useTutorial } from '../context/TutorialContext';
import { SPACING, FONT_SIZE } from '../utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TUTORIAL_CONTENT: Record<TutorialStepId, { message: string; position: 'top' | 'bottom' | 'center' }> = {
  home_category_tap: {
    message: 'Tap a category to view and add assets like vehicles, equipment, or property.',
    position: 'top',
  },
  home_category_longpress: {
    message: 'Long-press a category to customize its name and icon.',
    position: 'top',
  },
  category_add_asset: {
    message: 'Tap the + button to add your first asset to this category.',
    position: 'bottom',
  },
  assets_edit_button: {
    message: 'Tap Edit to reorder, rename, or add new asset categories.',
    position: 'top',
  },
  assets_reorder: {
    message: 'Drag the handle to reorder your categories. The top 6 show on the home screen.',
    position: 'center',
  },
  assets_separator: {
    message: 'Categories below the line are hidden from the home screen but still accessible here.',
    position: 'center',
  },
  asset_detail_add_task: {
    message: 'Tap + to add a maintenance task like oil changes, filter replacements, or inspections.',
    position: 'bottom',
  },
  inventory_add: {
    message: 'Tap + to track supplies like oil, filters, and parts. Get low-stock alerts when you\'re running low.',
    position: 'bottom',
  },
};

export default function TutorialOverlay() {
  const { activeTutorial, dismissTutorial } = useTutorial();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeTutorial) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [activeTutorial, fadeAnim]);

  if (!activeTutorial) return null;

  const content = TUTORIAL_CONTENT[activeTutorial];
  if (!content) return null;

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      dismissTutorial();
    });
  };

  const getTooltipPosition = () => {
    switch (content.position) {
      case 'top':
        return { top: 100 };
      case 'bottom':
        return { bottom: 120 };
      case 'center':
        return { top: '40%' as any };
    }
  };

  const getArrowStyle = () => {
    switch (content.position) {
      case 'top':
        return styles.arrowDown;
      case 'bottom':
        return styles.arrowUp;
      default:
        return null;
    }
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleDismiss}
      />
      <View style={[styles.tooltipContainer, getTooltipPosition()]}>
        {content.position === 'bottom' && (
          <View style={styles.arrowUpContainer}>
            <View style={styles.arrowUp} />
          </View>
        )}
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>{content.message}</Text>
          <TouchableOpacity style={styles.gotItButton} onPress={handleDismiss}>
            <Text style={styles.gotItText}>Got it</Text>
          </TouchableOpacity>
        </View>
        {content.position === 'top' && (
          <View style={styles.arrowDownContainer}>
            <View style={styles.arrowDown} />
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  tooltipContainer: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    alignItems: 'center',
  },
  tooltip: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: SPACING.md,
    maxWidth: SCREEN_WIDTH - SPACING.lg * 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
    textAlign: 'center',
  },
  gotItButton: {
    marginTop: SPACING.sm,
    alignSelf: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
  },
  gotItText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  arrowDownContainer: {
    alignItems: 'center',
  },
  arrowDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FF6B35',
  },
  arrowUpContainer: {
    alignItems: 'center',
  },
  arrowUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FF6B35',
  },
});
