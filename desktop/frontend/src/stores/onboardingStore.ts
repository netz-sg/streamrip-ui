import { create } from 'zustand';

interface OnboardingState {
  completed: boolean;
  currentStep: number;
  selectedService: string | null;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  selectService: (service: string) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const STORAGE_KEY = 'streamrip-onboarding';

function loadState(): { completed: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { completed: false };
}

function saveState(completed: boolean) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed }));
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  completed: loadState().completed,
  currentStep: 0,
  selectedService: null,

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: s.currentStep + 1 })),
  prevStep: () => set((s) => ({ currentStep: Math.max(0, s.currentStep - 1) })),
  selectService: (service) => set({ selectedService: service }),

  completeOnboarding: () => {
    saveState(true);
    set({ completed: true });
  },

  resetOnboarding: () => {
    saveState(false);
    set({ completed: false, currentStep: 0, selectedService: null });
  },
}));
