import { useMemo, useCallback } from "react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { AuiConfig, Tools } from "@assistant-ui/react";
import { toolkit } from "@/features/action-executor/toolkit";
import { DifyChatTransport } from "@/services/dify/dify-chat-transport";
import { clearCurrentSession, peekLastActionResult } from "@/services/dify/dify-conversation";

// Dify AI SDK 助手 Hook
// 使用 @assistant-ui/react-ai-sdk 的 useChatRuntime
// 替代手写 ChatModelAdapter + useLocalRuntime

export const useDifySDKAssistant = () => {
  const config = useMemo(() => AuiConfig({ tools: Tools({ toolkit }) }), []);
  const transport = useMemo(() => new DifyChatTransport(), []);

  const runtime = useChatRuntime({
    transport,
    // 工具执行完成后（addToolOutput），自动触发新请求发送 action_result 给 Dify
    // 根因：@ai-sdk/react 的 useChat 默认不自动发送，需显式配置
    sendAutomaticallyWhen: () => {
      // 仅当存在未消耗的工具执行结果时才自动发送
      // 工具执行完成后 executeAction 会调用 setLastActionResult 写入结果
      // 消耗后 buildDifyInputs 中的 consumeLastActionResult 会清空，防止重复发送
      return peekLastActionResult();
    }
  });

  const clearConversation = useCallback(() => {
    clearCurrentSession();
  }, []);

  return { runtime, config, clearConversation };
};
