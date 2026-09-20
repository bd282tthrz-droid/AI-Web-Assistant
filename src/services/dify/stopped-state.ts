import { create } from "zustand";

interface StoppedState {
  isStopped: boolean;
  set: (v: boolean) => void;
}

export const useStoppedState = create<StoppedState>((set) => ({
  isStopped: false,
  set: (v) => set({ isStopped: v }),
}));