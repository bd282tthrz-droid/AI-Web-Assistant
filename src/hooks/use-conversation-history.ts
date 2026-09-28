// 会话历史恢复 Hook
// 从 Dify API 获取历史消息，返回 messageRepository 供 useChatRuntime 消费

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { getConversationId } from "@/services/dify/dify-conversation";
import { fetchConversationMessages } from "@/services/dify/dify-api";
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
  });

  const messageRepository = useMemo<MessageRepo | undefined>(() => {
    if (!conversationId || !data?.data) return undefined;

    const messages: MessageRepo["messages"] = [];
    let parentId: string | null = null;

    for (const [index, row] of data.data.entries()) {
      for (const [role, text] of [
        ["user", row.query],
        ["assistant", row.answer],
      ] as const) {
        if (!text) continue;

        const id = `${conversationId}:${row.id ?? index}:${role}`;
        messages.push({
          message: { id, role, parts: [{ type: "text", text }] } as UIMessage,
          parentId,
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
