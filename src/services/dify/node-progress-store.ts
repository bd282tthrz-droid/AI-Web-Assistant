// NodeProgressStore - 进度追踪存储（内存级）
// 不持久化：数字索引 key 与 Thread 的消息数组同生命周期
// 跨会话（关闭重开/刷新）历史消息由 NodeProgressPanel 的 isHistory 拦截，不显示节点
// 持久化反而会让旧会话的数字 key 残留，被新会话相同 index 读到 → 数据污染，故移除

import { create } from "zustand";
import { createDebugLogger } from "@/utils/debug-log";

type ProgressItem = { title: string; done: boolean };

// 节点组状态：为每个 messageId 的节点列表添加整组级状态管理
interface NodeGroupState {
  nodes: ProgressItem[];
  isFinished: boolean; // 整组是否已结束
  finishedAt?: number; // 结束时间戳
}

interface NodeProgressStore {
  // 按 key（数字索引 / composite messageId）索引的节点组数据
  nodesByMessage: Record<string, NodeGroupState>;

  // 当前正在流式的消息 key
  activeMessageId: string | null;

  setActiveMessage: (compositeMessageId: string) => void;

  // 添加节点
  addNode: (title: string) => void;

  // 标记整组节点完成
  complete: () => void;

  // 清理当前活动消息
  reset: () => void;

  // 获取某组节点的状态
  getNodeGroup: (messageId: string) => NodeGroupState | undefined;
}

const debugLog = createDebugLogger("[node-progress-store]");

export const useNodeProgress = create<NodeProgressStore>((set, get) => ({
  nodesByMessage: {},
  activeMessageId: null,

  setActiveMessage: (compositeId) => {
    debugLog.log("[setActiveMessage]", compositeId);
    set({ activeMessageId: compositeId });
  },

  addNode: (title) =>
    set((s) => {
      if (!s.activeMessageId) return {};

      const existingGroup = s.nodesByMessage[s.activeMessageId];
      const existingNodes = existingGroup?.nodes ?? [];

      debugLog.log("[addNode]", title);
      return {
        nodesByMessage: {
          ...s.nodesByMessage,
          [s.activeMessageId]: {
            nodes: [...(existingNodes?.map((n) => ({ ...n, done: true })) ?? []), { title, done: false }],
            isFinished: false,
            finishedAt: undefined
          }
        }
      };
    }),

  complete: () =>
    set((s) => {
      if (!s.activeMessageId || !s.nodesByMessage[s.activeMessageId]) return {};

      const currentGroup = s.nodesByMessage[s.activeMessageId];
      debugLog.log("[complete] marking nodes as done for", s.activeMessageId);

      return {
        nodesByMessage: {
          ...s.nodesByMessage,
          [s.activeMessageId]: {
            ...currentGroup,
            nodes: currentGroup.nodes.map((n) => ({ ...n, done: true })),
            isFinished: true,
            finishedAt: Date.now()
          }
        },
        activeMessageId: null
      };
    }),

  reset: () => {
    debugLog.log("[reset]");
    set({ activeMessageId: null });
  },

  getNodeGroup: (messageId) => get().nodesByMessage[messageId]
}));