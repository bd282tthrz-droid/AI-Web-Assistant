import { create } from "zustand";

type ProgressItem = { title: string; done: boolean };

interface NodeProgressStore {
  // 按消息ID索引的节点数据 — 唯一存储，实时+持久化合一
  nodesByMessage: Record<string, ProgressItem[]>;

  // 当前正在流式的消息ID（由 transport 在 response-metadata 到达时设置）
  activeMessageId: string | null;

  // 暂存区：response-metadata 到达前收到的节点
  _pendingBuffer: ProgressItem[];

  // 当 response-metadata 携带的 ID 确认后，将 pending 数据迁移到 nodesByMessage
  setActiveMessage: (messageId: string) => void;

  // 添加节点：有 activeMessageId 直接写入 mapping，否则写入 pending
  addNode: (title: string) => void;

  // 标记所有节点完成
  complete: () => void;

  // 清理当前活动消息的数据（新消息开始时调用）
  reset: () => void;
}

export const useNodeProgress = create<NodeProgressStore>((set, get) => ({
  nodesByMessage: {},
  activeMessageId: null,
  _pendingBuffer: [],

  setActiveMessage: (id) => {
    const { _pendingBuffer, nodesByMessage } = get();
    if (_pendingBuffer.length > 0) {
      set({
        activeMessageId: id,
        _pendingBuffer: [],
        nodesByMessage: { ...nodesByMessage, [id]: _pendingBuffer }
      });
    } else {
      set({ activeMessageId: id });
    }
  },

  addNode: (title) =>
    set((s) => {
      const markPreviousDone = (items: ProgressItem[]) => [
        ...items.map((n) => ({ ...n, done: true })),
        { title, done: false }
      ];

      if (s.activeMessageId) {
        const existing = s.nodesByMessage[s.activeMessageId] ?? [];
        return {
          nodesByMessage: {
            ...s.nodesByMessage,
            [s.activeMessageId]: markPreviousDone(existing)
          }
        };
      }

      // 还不知道 messageId → 写入 pending
      return { _pendingBuffer: markPreviousDone(s._pendingBuffer) };
    }),

  complete: () =>
    set((s) => {
      if (s.activeMessageId && s.nodesByMessage[s.activeMessageId]) {
        return {
          nodesByMessage: {
            ...s.nodesByMessage,
            [s.activeMessageId]: s.nodesByMessage[s.activeMessageId].map(
              (n) => ({ ...n, done: true })
            )
          },
          activeMessageId: null
        };
      }
      return {
        _pendingBuffer: s._pendingBuffer.map((n) => ({ ...n, done: true })),
        activeMessageId: null
      };
    }),

  reset: () =>
    set((s) => {
      if (s.activeMessageId && s.nodesByMessage[s.activeMessageId]) {
        const { [s.activeMessageId]: _, ...rest } = s.nodesByMessage;
        return {
          nodesByMessage: rest,
          activeMessageId: null,
          _pendingBuffer: []
        };
      }
      return { activeMessageId: null, _pendingBuffer: [] };
    })
}));