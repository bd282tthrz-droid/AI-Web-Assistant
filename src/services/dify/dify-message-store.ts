// Dify message ID 映射存储 + 反馈状态
// difyIds: UIMessage ID → Dify message ID
// reactions: UIMessage ID → 当前反馈状态（用于 UI 响应式更新）

import { create } from "zustand";
import type { Reaction } from "@/components/elements/message-actions";
import { createDebugLogger } from "@/utils/debug-log";

const debugLog = createDebugLogger("[message-store]");

interface DifyMessageStore {
  difyIds: Readonly<Record<string, string>>;
  reactions: Readonly<Record<string, Reaction>>;
  setDifyId: (uiMessageId: string, difyMessageId: string) => void;
  setReaction: (uiMessageId: string, reaction: Reaction) => void;
}

export const useDifyMessageStore = create<DifyMessageStore>((set) => ({
  difyIds: {},
  reactions: {},
  setDifyId: (uiMessageId, difyMessageId) =>
    set((state) => ({ difyIds: { ...state.difyIds, [uiMessageId]: difyMessageId } as Record<string, string> })),
  setReaction: (uiMessageId, reaction) => {
    debugLog.log("setReaction:", uiMessageId, reaction);
    set((state) => ({ reactions: { ...state.reactions, [uiMessageId]: reaction } as Record<string, Reaction> }));
  },
}));