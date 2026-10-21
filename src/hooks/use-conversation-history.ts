// 会话历史恢复 Hook
// 从 Dify API 获取历史消息，返回 messageRepository 供 useChatRuntime 消费

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { getConversationId } from "@/services/dify/dify-conversation";
import { fetchConversationMessages } from "@/services/dify/dify-api";
import { useDifyMessageStore } from "@/services/dify/dify-message-store";
import { createDebugLogger } from "@/utils/debug-log";

const debugLog = createDebugLogger("[conversation-history]");

interface MessageRepo {
  messages: Array<{ message: UIMessage; parentId: string | null }>;
  headId?: string;
}

export const useConversationHistory = (): {
  messageRepository: MessageRepo | undefined;
} => {
  const conversationId = getConversationId();

  const { data } = useQuery({
    queryKey: ["conversation-history", conversationId],
    queryFn: () => fetchConversationMessages(conversationId!, 20),
    enabled: !!conversationId,
    // 组件卸载后重新挂载时始终重新请求，避免缓存旧 feedback 数据
    refetchOnMount: "always",
  });

  // 渲染阶段写入 store，AssistantMessage 挂载时通过订阅读到最新值
  if (conversationId && data?.data) {
    const store = useDifyMessageStore.getState();
    for (const row of data.data) {
      if (!row.id) continue;
      const uiId = `${conversationId}:${row.id}:assistant`;
      store.setDifyId(uiId, row.id);
      if (row.feedback?.rating) {
        debugLog.log("setReaction:", uiId, row.feedback.rating === "like" ? "up" : "down");
        store.setReaction(uiId, row.feedback.rating === "like" ? "up" : "down");
      }
    }
  }

  const messageRepository = useMemo<MessageRepo | undefined>(() => {
    if (!conversationId || !data?.data) return undefined;

    const messages: MessageRepo["messages"] = [];
    let parentId: string | null = null;

    for (const [index, row] of data.data.entries()) {
      for (const [role, text] of [
        ["user", row.query],
        ["assistant", row.answer]
      ] as const) {
        if (!text) continue;

        const id = `${conversationId}:${row.id ?? index}:${role}`;
        messages.push({
          message: {
            id,
            role,
            parts: [{ type: "text", text }],
            metadata: { custom: { isHistory: true } }
          } as UIMessage,
          parentId
        });
        parentId = id;
      }
    }

    const repo = { messages, headId: parentId ?? undefined };
    debugLog.log("built messageRepository:", repo.messages.length, "headId:", repo.headId);
    return repo;
  }, [conversationId, data]);

  return { messageRepository };
};
