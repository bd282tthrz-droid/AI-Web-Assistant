import { useCallback, useEffect, type FC } from "react";
import { useAuiState } from "@assistant-ui/store";
import { useStoppedState } from "@/services/dify/stopped-state";
import { StoppedRun } from "@/components/assistant-ui/elements/stopped-run";

interface StoppedRunPanelProps {
  readonly onContinue: () => void;
}

const StoppedRunPanel: FC<StoppedRunPanelProps> = ({ onContinue }) => {
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const messages = useAuiState((s) => s.thread.messages);
  const { isStopped, set: setStopped } = useStoppedState();

  // 新消息发送时重置停止状态
  useEffect(() => {
    if (isRunning) {
      setStopped(false);
    }
  }, [isRunning, setStopped]);

  // 提取当前助理消息文本
  const lastAssistantText = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === "assistant") {
        return msg.content
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join(" ");
      }
    }
    return "";
  })();

  // Discard 回调 - 使用 getState() 惰性访问 store，避免额外订阅
  const handleDiscard = useCallback(() => {
    const state = (
      useAuiState as unknown as {
        getState: () => {
          thread: {
            messages: Array<{ role: string; id?: string }>;
            deleteMessage: (id: string) => void;
          };
        };
      }
    ).getState();
    const lastAssistantMsg = [...state.thread.messages].reverse().find((m) => m.role === "assistant");
    if (lastAssistantMsg?.id) {
      state.thread.deleteMessage(lastAssistantMsg.id);
    }
  }, []);

  if (!isRunning && isStopped) {
    return (
      <StoppedRun
        words={[lastAssistantText]}
        reason="Stopped"
        onContinue={onContinue}
        onDiscard={handleDiscard}
      />
    );
  }

  return null;
};

export default StoppedRunPanel;