import { useMemo, useCallback } from "react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { AuiConfig, Tools } from "@assistant-ui/react";
import { toolkit } from "@/features/action-executor/toolkit";
import { DifyChatTransport } from "@/services/dify/dify-chat-transport";
import { clearCurrentSession } from "@/services/dify/dify-conversation";
import { suggestionAdapter } from "@/services/suggestion/suggestion-adapter";

// Dify AI SDK 助手 Hook
// 使用 @assistant-ui/react-ai-sdk 的 useChatRuntime
// 替代手写 ChatModelAdapter + useLocalRuntime

export const useDifySDKAssistant = () => {
  const config = useMemo(() => AuiConfig({ tools: Tools({ toolkit }) }), []);
  const transport = useMemo(() => new DifyChatTransport(), []);

  const runtime = useChatRuntime({
    transport,
    adapters: {
      suggestion: suggestionAdapter
    }
  });

  const clearConversation = useCallback(() => {
    clearCurrentSession();
  }, []);

  return { runtime, config, clearConversation };
};
