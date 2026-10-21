// 页面总结请求触发计数 Store
// 点击 "Summarize page" 浮标时递增 seq，SummaryRequestTrigger 监听 seq 变化执行发送
// 与 form-fill-context 的 seq 模式一致：每次点击独立递增，保证重复点击可重复触发

import { create } from "zustand";

interface SummaryStore {
  readonly seq: number;
  request: () => void;
}

export const useSummaryStore = create<SummaryStore>((set) => ({
  seq: 0,
  request: () => set((s) => ({ seq: s.seq + 1 })),
}));