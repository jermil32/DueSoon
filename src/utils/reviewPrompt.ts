import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_KEY = '@duesoon_review_state';
const LOG_MILESTONE = 3; // Ask after 3rd log
const MIN_DAYS_BETWEEN_PROMPTS = 90;

interface ReviewState {
  logCount: number;
  lastPromptedAt: number | null;
  hasRated: boolean;
}

async function getReviewState(): Promise<ReviewState> {
  const data = await AsyncStorage.getItem(REVIEW_KEY);
  if (data) return JSON.parse(data);
  return { logCount: 0, lastPromptedAt: null, hasRated: false };
}

async function saveReviewState(state: ReviewState): Promise<void> {
  await AsyncStorage.setItem(REVIEW_KEY, JSON.stringify(state));
}

export async function maybeRequestReview(): Promise<void> {
  try {
    const state = await getReviewState();
    state.logCount += 1;

    // Don't prompt if user already rated
    if (state.hasRated) {
      await saveReviewState(state);
      return;
    }

    // Don't prompt too frequently
    if (state.lastPromptedAt) {
      const daysSinceLastPrompt = (Date.now() - state.lastPromptedAt) / (1000 * 60 * 60 * 24);
      if (daysSinceLastPrompt < MIN_DAYS_BETWEEN_PROMPTS) {
        await saveReviewState(state);
        return;
      }
    }

    // Prompt at milestones: 3rd log, then every 10 logs after that
    const shouldPrompt =
      state.logCount === LOG_MILESTONE ||
      (state.logCount > LOG_MILESTONE && (state.logCount - LOG_MILESTONE) % 10 === 0);

    if (shouldPrompt) {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        await StoreReview.requestReview();
        state.lastPromptedAt = Date.now();
        state.hasRated = true;
      }
    }

    await saveReviewState(state);
  } catch (error) {
    // Silently fail - review prompts should never block the user
    console.error('Review prompt error:', error);
  }
}
