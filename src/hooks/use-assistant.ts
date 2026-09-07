import { useMemo } from "react";
import { AuiConfig, Tools } from "@assistant-ui/react";
import { BACKEND_CONFIG } from "@/services/backend/backend-config";
import { useDifyAssistant } from "./use-dify-assistant";
import { useDifySDKAssistant } from "./use-dify-sdk-assistant";
import { useLocalAssistant } from "./use-local-assistant";
import { toolkit, HUMAN_TOOL_NAMES } from "@/features/action-executor/toolkit";

// 助手统一入口 Hook
// 根据后端模式（dify / dify-sdk / local）自动分发到对应实现
// 三种模式返回结构一致：{ runtime, config, clearConversation }

export const useAssistant = () => {
  // 注入工具配置（defineToolkit + Tools）
  const config = useMemo(() => AuiConfig({ tools: Tools({ toolkit }) }), []);

  if (BACKEND_CONFIG.mode === "local") {
    return useLocalAssistant({ config, humanToolNames: HUMAN_TOOL_NAMES });
  }
  if (BACKEND_CONFIG.mode === "dify-sdk") {
    return useDifySDKAssistant();
  }
  return useDifyAssistant({ config, humanToolNames: HUMAN_TOOL_NAMES });
};
