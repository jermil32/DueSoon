import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';
import { usePremium, FREE_ASSET_LIMIT } from '../context/PremiumContext';
import { SPACING, FONT_SIZE } from '../utils/constants';

type Props = RootStackScreenProps<'Upgrade'>;

const PREMIUM_FEATURES = [
  {
    title: 'Unlimited Assets',
    description: `Track all your vehicles, equipment, and properties (Free: ${FREE_ASSET_LIMIT} assets)`,
    icon: '🚗',
  },
  {
    title: 'PDF Export',
    description: 'Generate professional service history reports for resale or records',
    icon: '📄',
  },
  {
    title: 'Dark Mode',
    description: 'True black OLED theme that saves battery and looks great',
    icon: '🌙',
  },
  {
    title: 'Priority Support',
    description: 'Get help faster when you need it',
    icon: '⭐',
  },
];

export default function UpgradeScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { purchasePremium, restorePurchase, currentOffering, isLoading } = usePremium();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const feature = route.params?.feature;

  // Get price from RevenueCat offering, fallback to default
  const price = currentOffering?.lifetime?.product.priceString || '$9.99';

  const handlePurchase = async () => {
    setPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const success = await purchasePremium();

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Welcome to Premium!',
          'Thank you for your purchase. All premium features are now unlocked.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
      // If not successful and not cancelled, purchasePremium handles the error
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Purchase Failed', error.message || 'Unable to complete purchase. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const restored = await restorePurchase();

      if (restored) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Purchase Restored',
          'Your premium access has been restored.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          'No Purchase Found',
          'We couldn\'t find a previous purchase for this account.'
        );
      }
    } catch (error) {
      Alert.alert('Restore Failed', 'Unable to restore purchase. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const styles = createStyles(colors);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.logo}>DueSoon</Text>
        <Text style={styles.premiumBadge}>PREMIUM</Text>
      </View>

      {feature && (
        <View style={styles.featureHighlight}>
          <Text style={styles.featureHighlightText}>
            Unlock {feature} and more with Premium
          </Text>
        </View>
      )}

      <Text style={styles.headline}>
        Never Miss Maintenance Again
      </Text>
      <Text style={styles.subheadline}>
        Unlock all features with a one-time purchase
      </Text>

      <View style={styles.featuresContainer}>
        {PREMIUM_FEATURES.map((item, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{item.icon}</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{item.title}</Text>
              <Text style={styles.featureDescription}>{item.description}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.price}>{price}</Text>
        <Text style={styles.priceSubtext}>One-time purchase • Lifetime access</Text>
      </View>

      <TouchableOpacity
        style={[styles.purchaseButton, purchasing && styles.buttonDisabled]}
        onPress={handlePurchase}
        disabled={purchasing || restoring}
      >
        <Text style={styles.purchaseButtonText}>
          {purchasing ? 'Processing...' : 'Unlock Premium'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.restoreButton}
        onPress={handleRestore}
        disabled={purchasing || restoring}
      >
        <Text style={styles.restoreButtonText}>
          {restoring ? 'Restoring...' : 'Restore Purchase'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.terms}>
        Payment will be charged to your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play account'}. By purchasing, you agree to our Terms of Service.
      </Text>
    </ScrollView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: SPACING.md,
      fontSize: FONT_SIZE.md,
      color: colors.textSecondary,
    },
    content: {
      padding: SPACING.lg,
      paddingBottom: SPACING.xl * 2,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.lg,
      gap: SPACING.sm,
    },
    logo: {
      fontSize: FONT_SIZE.xxl,
      fontWeight: '700',
      color: colors.text,
    },
    premiumBadge: {
      fontSize: FONT_SIZE.sm,
      fontWeight: '700',
      color: colors.surface,
      backgroundColor: colors.primary,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: 4,
      overflow: 'hidden',
    },
    featureHighlight: {
      backgroundColor: colors.primary + '20',
      padding: SPACING.md,
      borderRadius: 8,
      marginBottom: SPACING.lg,
    },
    featureHighlightText: {
      color: colors.primary,
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
      textAlign: 'center',
    },
    headline: {
      fontSize: FONT_SIZE.title,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: SPACING.sm,
    },
    subheadline: {
      fontSize: FONT_SIZE.lg,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: SPACING.xl,
    },
    featuresContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: SPACING.md,
      marginBottom: SPACING.xl,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    featureIcon: {
      fontSize: 28,
      marginRight: SPACING.md,
    },
    featureText: {
      flex: 1,
    },
    featureTitle: {
      fontSize: FONT_SIZE.lg,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    featureDescription: {
      fontSize: FONT_SIZE.sm,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    priceContainer: {
      alignItems: 'center',
      marginBottom: SPACING.lg,
    },
    price: {
      fontSize: 48,
      fontWeight: '700',
      color: colors.primary,
    },
    priceSubtext: {
      fontSize: FONT_SIZE.md,
      color: colors.textSecondary,
      marginTop: SPACING.xs,
    },
    purchaseButton: {
      backgroundColor: colors.primary,
      paddingVertical: SPACING.md,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    purchaseButtonText: {
      color: '#FFFFFF',
      fontSize: FONT_SIZE.lg,
      fontWeight: '700',
    },
    restoreButton: {
      paddingVertical: SPACING.md,
      alignItems: 'center',
    },
    restoreButtonText: {
      color: colors.primary,
      fontSize: FONT_SIZE.md,
      fontWeight: '500',
    },
    terms: {
      fontSize: FONT_SIZE.sm,
      color: colors.textLight,
      textAlign: 'center',
      marginTop: SPACING.lg,
      lineHeight: 18,
    },
  });
