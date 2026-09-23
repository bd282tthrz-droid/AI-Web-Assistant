import { create } from "zustand";

type ProgressItem = { title: string; done: boolean };

interface MessageNodeStore {
  nodesByMessage: Record<string, ProgressItem[]>;
  saveNodes: (messageId: string, nodes: ProgressItem[]) => void;
}

// 按 messageId 独立存储节点快照，每条消息的进度互不干扰
export const useMessageNodeStore = create<MessageNodeStore>((set) => ({
  nodesByMessage: {},
  saveNodes: (messageId, nodes) =>
    set((s) => ({
      nodesByMessage: { ...s.nodesByMessage, [messageId]: nodes },
    })),
}));