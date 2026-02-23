import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackScreenProps } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE } from '../utils/constants';

const AFFILIATE_TAG = 'plantwell01-20';

type Props = RootStackScreenProps<'AmazonBrowser'>;

export default function AmazonBrowserScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { searchUrl } = route.params;
  const webViewRef = useRef<WebView>(null);
  const [currentUrl, setCurrentUrl] = useState(searchUrl);
  const [loading, setLoading] = useState(true);

  const isProductPage = (url: string) => {
    return /amazon\.com\/(dp|gp\/product|.*\/dp)\/[A-Z0-9]{10}/i.test(url);
  };

  const appendAffiliateTag = (url: string) => {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('tag', AFFILIATE_TAG);
      return parsed.toString();
    } catch {
      if (url.includes('?')) {
        return `${url}&tag=${AFFILIATE_TAG}`;
      }
      return `${url}?tag=${AFFILIATE_TAG}`;
    }
  };

  const handleAddToInventory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const taggedUrl = appendAffiliateTag(currentUrl);
    if (route.params.onSelectUrl) {
      route.params.onSelectUrl(taggedUrl);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Amazon
        </Text>
        <View style={styles.closeButton} />
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: searchUrl }}
        style={styles.webview}
        onNavigationStateChange={(navState) => {
          setCurrentUrl(navState.url);
        }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {isProductPage(currentUrl) && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddToInventory}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add to Inventory</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  closeButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', flex: 1, textAlign: 'center' },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9900',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
});
