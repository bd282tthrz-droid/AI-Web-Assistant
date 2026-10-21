// TurnStore - 前端每轮对话唯一 ID 存储
// 每轮对话开始生成前端 turnId，用于按轮次关联错误状态
// 不依赖 assistant-ui 会变化的 message.id

import { create } from "zustand";
import { createDebugLogger } from "@/utils/debug-log";

const debugLog = createDebugLogger("[turn-store]");

// 生成唯一 turnId：时间戳(base36) + 随机段
const generateTurnId = (): string => {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `turn-${ts}-${rand}`;
};

interface TurnStore {
  // 当前轮的 turnId
  currentTurnId: string | null;
  // 按 turnId 分轮存储错误（同 session 内累计保留，不随轮次清空）
  errors: Readonly<Record<string, string>>;
  // messageId → turnId 映射（渲染侧查询）
  messageTurnMap: Readonly<Record<string, string>>;

  // 开始新一轮：生成 turnId 并设为 current
  startTurn: () => string;
  // 按轮记录错误
  setError: (turnId: string, error: string) => void;
  // 绑定 messageId 与 turnId
  bindMessageId: (messageId: string, turnId: string) => void;
}

export const useTurnStore = create<TurnStore>((set) => ({
  currentTurnId: null,
  errors: {},
  messageTurnMap: {},

  startTurn: () => {
    const turnId = generateTurnId();
    debugLog.log("[startTurn]", turnId);
    set({ currentTurnId: turnId });
    return turnId;
  },

  setError: (turnId, error) =>
    set((s) => ({
      errors: { ...s.errors, [turnId]: error } as Record<string, string>
    })),

  bindMessageId: (messageId, turnId) =>
    set((s) => ({
      messageTurnMap: { ...s.messageTurnMap, [messageId]: turnId } as Record<string, string>
    }))
}));

// 同时导出 fetch 出错时 provider 用的同步读取 helper
export const getCurrentTurnId = (): string | null => useTurnStore.getState().currentTurnId;