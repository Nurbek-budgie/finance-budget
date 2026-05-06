import { create } from 'zustand';

type ActiveTab = 'dashboard' | 'upload';

interface UIState {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const useUIStore = create<UIState>(set => ({
  activeTab: 'dashboard',
  setActiveTab: tab => set({ activeTab: tab }),
}));
