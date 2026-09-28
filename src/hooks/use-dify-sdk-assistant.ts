import { useMemo, useCallback } from "react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { AuiConfig, Tools } from "@assistant-ui/react";
import { toolkit } from "@/features/action-executor/toolkit";
import { DifyChatTransport } from "@/services/dify/dify-chat-transport";
import { clearCurrentSession } from "@/services/dify/dify-conversation";
import { suggestionAdapter } from "@/services/suggestion/suggestion-adapter";
import type { UIMessage } from "ai";

// Dify AI SDK 助手 Hook
// 使用 @assistant-ui/react-ai-sdk 的 useChatRuntime

export const useDifySDKAssistant = (
  messageRepository?: {
    messages: Array<{ message: UIMessage; parentId: string | null }>;
    headId?: string;
  },
) => {
  const config = useMemo(() => AuiConfig({ tools: Tools({ toolkit }) }), []);
  const transport = useMemo(() => new DifyChatTransport(), []);

  const runtime = useChatRuntime({
    transport,
    adapters: {
      suggestion: suggestionAdapter,
    },
    messageRepository,
  });

  const clearConversation = useCallback(() => {
    clearCurrentSession();
  }, []);

  return { runtime, config, clearConversation };
};
