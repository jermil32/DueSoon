import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREMIUM_KEY = '@duesoon_premium';
export const FREE_ASSET_LIMIT = 3;

interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  unlockPremium: () => Promise<void>;
  restorePurchase: () => Promise<boolean>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const stored = await AsyncStorage.getItem(PREMIUM_KEY);
      setIsPremium(stored === 'true');
    } catch (error) {
      console.error('Error checking premium status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const unlockPremium = async () => {
    // In production, this would be called after successful IAP
    // For now, we just set the flag directly
    await AsyncStorage.setItem(PREMIUM_KEY, 'true');
    setIsPremium(true);
  };

  const restorePurchase = async (): Promise<boolean> => {
    // In production, this would verify with App Store/Play Store
    // For now, check if they previously purchased
    try {
      const stored = await AsyncStorage.getItem(PREMIUM_KEY);
      if (stored === 'true') {
        setIsPremium(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error restoring purchase:', error);
      return false;
    }
  };

  return (
    <PremiumContext.Provider value={{ isPremium, isLoading, unlockPremium, restorePurchase }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}
