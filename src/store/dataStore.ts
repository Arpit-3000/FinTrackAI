import { create } from 'zustand';

interface DataState {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));
