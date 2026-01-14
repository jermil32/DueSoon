import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZE } from '../utils/constants';
import { getSettings, saveSettings } from '../storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface Slide {
  id: string;
  title: string;
  titleColor?: string;
  description: string;
  icon: React.ReactNode;
}

function CarIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path
        d="M2 28 L2 22 L6 22 L10 14 L30 14 L34 22 L38 22 L38 28 L34 28 C34 28 33 24 30 24 C27 24 26 28 26 28 L14 28 C14 28 13 24 10 24 C7 24 6 28 6 28 L2 28"
        fill={color}
      />
      <Circle cx="10" cy="28" r="5" fill={color} />
      <Circle cx="10" cy="28" r="2.5" fill="white" />
      <Circle cx="30" cy="28" r="5" fill={color} />
      <Circle cx="30" cy="28" r="2.5" fill="white" />
      <Path d="M12 22 L14 16 L18 16 L18 22 Z" fill="white" />
      <Path d="M20 22 L20 16 L28 16 L30 22 Z" fill="white" />
    </Svg>
  );
}

function BellIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path
        d="M20 4 C20 4 12 4 12 14 L12 22 L6 28 L6 30 L34 30 L34 28 L28 22 L28 14 C28 4 20 4 20 4"
        fill={color}
      />
      <Circle cx="20" cy="34" r="4" fill={color} />
      <Rect x="18" y="2" width="4" height="4" rx="2" fill={color} />
    </Svg>
  );
}

function ChecklistIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Rect x="4" y="4" width="32" height="32" rx="4" fill={color} />
      <Line x1="10" y1="12" x2="18" y2="12" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <Line x1="22" y1="12" x2="30" y2="12" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <Line x1="10" y1="20" x2="18" y2="20" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <Line x1="22" y1="20" x2="30" y2="20" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <Line x1="10" y1="28" x2="18" y2="28" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <Line x1="22" y1="28" x2="30" y2="28" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
}

function RocketIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path
        d="M20 2 C20 2 32 8 32 22 L26 28 L14 28 L8 22 C8 8 20 2 20 2"
        fill={color}
      />
      <Circle cx="20" cy="16" r="4" fill="white" />
      <Path d="M8 22 L4 30 L12 26 Z" fill={color} />
      <Path d="M32 22 L36 30 L28 26 Z" fill={color} />
      <Path d="M16 28 L16 36 L20 32 L24 36 L24 28 Z" fill={color} />
    </Svg>
  );
}

function DueSoonLogo() {
  return (
    <View style={styles.logoContainer}>
      <Image
        source={require('../../assets/duesoon-logo.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />
    </View>
  );
}

const slides: Slide[] = [
  {
    id: 'welcome',
    title: '',
    description: 'Your personal maintenance tracker for vehicles, equipment, and property.',
    icon: <DueSoonLogo />,
  },
  {
    id: 'track',
    title: 'Track Everything',
    titleColor: COLORS.secondary,
    description: 'Keep all your maintenance schedules in one place. From oil changes to filter replacements, never lose track again.',
    icon: <CarIcon size={100} color={COLORS.secondary} />,
  },
  {
    id: 'reminders',
    title: 'Never Miss a Due Date',
    titleColor: COLORS.primary,
    description: 'Get timely reminders before maintenance is due. Stay ahead of problems and avoid costly repairs.',
    icon: <BellIcon size={100} color={COLORS.primary} />,
  },
  {
    id: 'organize',
    title: 'Stay Organized',
    titleColor: COLORS.secondary,
    description: 'Log completed maintenance, track costs, and keep a full history of all your assets.',
    icon: <ChecklistIcon size={100} color={COLORS.secondary} />,
  },
  {
    id: 'start',
    title: "Let's Get Started!",
    titleColor: COLORS.primary,
    description: 'Add your first vehicle, equipment, or property and set up maintenance reminders in minutes.',
    icon: <RocketIcon size={100} color={COLORS.primary} />,
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const goToNextSlide = () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    const settings = await getSettings();
    await saveSettings({
      ...settings,
      onboardingCompleted: true,
    });
    onComplete();
  };

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.skipContainer}>
        {!isLastSlide && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <View style={styles.iconContainer}>{slide.icon}</View>
            <Text
              style={[
                styles.title,
                slide.titleColor ? { color: slide.titleColor } : {},
              ]}
            >
              {slide.title}
            </Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomContainer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={goToNextSlide}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  skipContainer: {
    position: 'absolute',
    top: 60,
    right: SPACING.lg,
    zIndex: 10,
  },
  skipButton: {
    padding: SPACING.sm,
  },
  skipText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 400,
    height: 200,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 50,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: COLORS.primary,
  },
  inactiveDot: {
    backgroundColor: COLORS.border,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
});
