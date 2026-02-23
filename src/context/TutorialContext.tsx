import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { TutorialStepId } from '../types';
import { getSettings, saveSettings } from '../storage';

interface TutorialContextType {
  showTutorial: (tutorialId: TutorialStepId) => void;
  shouldShowTutorial: (tutorialId: TutorialStepId) => boolean;
  dismissTutorial: () => void;
  resetTutorials: () => Promise<void>;
  dismissedAll: boolean;
  completedTutorials: TutorialStepId[];
  activeTutorial: TutorialStepId | null;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [completedTutorials, setCompletedTutorials] = useState<TutorialStepId[]>([]);
  const [dismissedAll, setDismissedAll] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<TutorialStepId | null>(null);

  useEffect(() => {
    loadTutorialState();
  }, []);

  const loadTutorialState = async () => {
    const settings = await getSettings();
    setCompletedTutorials(settings.completedTutorials || []);
    setDismissedAll(settings.tutorialDismissedAll || false);
  };

  const showTutorial = useCallback((tutorialId: TutorialStepId) => {
    if (!completedTutorials.includes(tutorialId) && !dismissedAll) {
      setActiveTutorial(tutorialId);
    }
  }, [completedTutorials, dismissedAll]);

  const dismissTutorial = useCallback(() => {
    if (activeTutorial) {
      const tutorialId = activeTutorial;
      setActiveTutorial(null);
      setCompletedTutorials(prev => {
        if (prev.includes(tutorialId)) return prev;
        const updated = [...prev, tutorialId];
        getSettings().then(settings => {
          saveSettings({ ...settings, completedTutorials: updated });
        });
        return updated;
      });
    }
  }, [activeTutorial]);

  const shouldShowTutorial = useCallback((tutorialId: TutorialStepId) => {
    return !completedTutorials.includes(tutorialId) && !dismissedAll;
  }, [completedTutorials, dismissedAll]);

  const resetTutorials = useCallback(async () => {
    setCompletedTutorials([]);
    setDismissedAll(false);
    setActiveTutorial(null);
    const settings = await getSettings();
    await saveSettings({ ...settings, completedTutorials: [], tutorialDismissedAll: false });
  }, []);

  return (
    <TutorialContext.Provider value={{
      showTutorial,
      shouldShowTutorial,
      dismissTutorial,
      resetTutorials,
      dismissedAll,
      completedTutorials,
      activeTutorial,
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}
