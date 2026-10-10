// 消息运行状态管理 Hook
// 根据 assistant-ui 的 isRunning 状态：开始运行时重置进度/停止标记
// 节点保存已移至 dify-chat-transport 的 finalStep.then 中同步完成

import { useEffect } from "react";
import { useAuiState } from "@assistant-ui/store";
import { useNodeProgress } from "@/services/dify/node-progress-store";
import { useStoppedState } from "@/services/dify/stopped-state";

export const useMessageRunState = () => {
  const isRunning = useAuiState((s) => s.thread.isRunning);

  useEffect(() => {
    if (isRunning) {
      useNodeProgress.getState().reset();
      useStoppedState.getState().set(false);
    }
  }, [isRunning]);
};