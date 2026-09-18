import { create } from "zustand";

type ProgressItem = { title: string; done: boolean };

interface NodeProgressStore {
  nodes: ProgressItem[];
  isActive: boolean;
  addNode: (title: string) => void;
  complete: () => void;
  reset: () => void;
}

export const useNodeProgress = create<NodeProgressStore>((set) => ({
  nodes: [],
  isActive: false,
  addNode: (title) =>
    set((s) => ({
      nodes: [
        ...s.nodes.map((n) => ({ ...n, done: true })),
        { title, done: false },
      ],
      isActive: true,
    })),
  complete: () =>
    set((s) => ({
      nodes: s.nodes.map((n) => ({ ...n, done: true })),
      isActive: false,
    })),
  reset: () => set({ nodes: [], isActive: false }),
}));