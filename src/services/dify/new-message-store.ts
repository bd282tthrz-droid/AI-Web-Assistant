// 新消息计数 store
// 最小化时记录已完成的新消息数量，显示在 FAB 角标上

import { create } from "zustand";

interface NewMessageStore {
  count: number;
  increment: () => void;
  reset: () => void;
}

export const useNewMessageStore = create<NewMessageStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 }),
}));