import { useMemo } from "react";
import { AuiConfig, Tools } from "@assistant-ui/react";
import { useDifySDKAssistant } from "./use-dify-sdk-assistant";
import { toolkit } from "@/features/action-executor/toolkit";
import type { UIMessage } from "ai";

// 助手统一入口 Hook
// 使用 Dify AI SDK 模式（通过 @assistant-ui/react-ai-sdk）

export const useAssistant = (
  messageRepository?: {
    messages: Array<{ message: UIMessage; parentId: string | null }>;
    headId?: string;
  },
) => {
  const config = useMemo(() => AuiConfig({ tools: Tools({ toolkit }) }), []);
  const { runtime, clearConversation } = useDifySDKAssistant(messageRepository);

  return { runtime, config, clearConversation };
};