import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesOffering } from 'react-native-purchases';

const REVENUECAT_API_KEY_ANDROID = 'goog_UZnmhSeHWJSjSeJUgFcNBPLUZcb';
const REVENUECAT_API_KEY_IOS = 'appl_UkcAELGzxIltxOUOwyGmMwTEohB';
const REVENUECAT_API_KEY = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
const ENTITLEMENT_ID = 'premium';

export const FREE_ASSET_LIMIT = 3;

interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  currentOffering: PurchasesOffering | null;
  purchasePremium: () => Promise<boolean>;
  restorePurchase: () => Promise<boolean>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);

  useEffect(() => {
    initializePurchases();
  }, []);

  const initializePurchases = async () => {
    try {
      // Configure RevenueCat
      Purchases.configure({ apiKey: REVENUECAT_API_KEY });

      // Check current customer info
      const customerInfo = await Purchases.getCustomerInfo();
      checkEntitlements(customerInfo);

      // Fetch offerings
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setCurrentOffering(offerings.current);
      }

      // Listen for customer info updates
      Purchases.addCustomerInfoUpdateListener((info) => {
        checkEntitlements(info);
      });
    } catch (error: any) {
      console.error('Error initializing purchases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkEntitlements = (customerInfo: CustomerInfo) => {
    const hasPremium = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
    setIsPremium(hasPremium);
  };

  const purchasePremium = async (): Promise<boolean> => {
    try {
      if (!currentOffering) {
        console.error('No offering available');
        throw new Error('Could not load purchase options. Please check your internet connection and try again.');
      }
      if (!currentOffering.lifetime) {
        console.error('No lifetime package in offering:', currentOffering);
        throw new Error('Premium package not available. Please try again later.');
      }

      const { customerInfo } = await Purchases.purchasePackage(currentOffering.lifetime);
      const hasPremium = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      setIsPremium(hasPremium);
      return hasPremium;
    } catch (error: any) {
      if (error.userCancelled) {
        return false;
      }
      console.error('Error purchasing:', error);
      throw error;
    }
  };

  const restorePurchase = async (): Promise<boolean> => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const hasPremium = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      setIsPremium(hasPremium);
      return hasPremium;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return false;
    }
  };

  return (
    <PremiumContext.Provider value={{
      isPremium,
      isLoading,
      currentOffering,
      purchasePremium,
      restorePurchase
    }}>
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
