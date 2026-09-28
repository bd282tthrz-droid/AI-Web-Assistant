import { MessagePrimitive } from "@assistant-ui/react";
import { useActionBarCopy } from "@assistant-ui/core/react";
import { useActionBarReload } from "@assistant-ui/core/react";
import { useAuiState, useAui } from "@assistant-ui/store";
import { useState, useCallback, useEffect, type FC } from "react";
import { MessageActions } from "@/components/elements/message-actions";
import type { Reaction } from "@/components/elements/message-actions";
import { createDebugLogger } from "@/utils/debug-log";
import { useNodeProgress } from "@/services/dify/node-progress-store";
import { useMessageNodeStore } from "@/services/dify/message-node-store";
import { useStoppedState } from "@/services/dify/stopped-state";
import NodeProgressPanel from "./node-progress-panel";
import ErrorPanel from "./error-panel";
import StoppedRunPanel from "./stopped-run-panel";
import { MessageContent } from "../message-content";
import { getSuggestions } from "@/constants/suggestion";

const debugLog = createDebugLogger("[assistant-message]");

interface AssistantMessageProps {
  readonly messageId: string;
}

const AssistantMessage: FC<AssistantMessageProps> = ({ messageId }) => {
  const [reaction, setReaction] = useState<Reaction>(null);
  const isRunning = useAuiState((s) => s.thread.isRunning);

  // 新消息发送时重置进度与停止状态（用 getState 避免额外订阅）
  useEffect(() => {
    if (isRunning) {
      useNodeProgress.getState().reset();
      useStoppedState.getState().set(false);
    } else {
      // 流结束 → 保存节点快照（messageId 已由 props 传入）
      const currentNodes = useNodeProgress.getState().nodes;
      if (messageId && currentNodes.length > 0) {
        useMessageNodeStore.getState().saveNodes(messageId, currentNodes);
      }
    }
  }, [isRunning]);

  // 复制功能
  const { copy, isCopied } = useActionBarCopy({
    copyToClipboard: async (text: string) => {
      await navigator.clipboard.writeText(text);
    }
  });

  // 重新生成功能
  const { reload, disabled: reloadDisabled } = useActionBarReload();

  // 重新生成回调（由 StoppedRunPanel 和 MessageActions 共用）
  const handleRegenerate = useCallback(() => {
    if (!reloadDisabled) reload();
  }, [reload, reloadDisabled]);

  const aui = useAui();

  const handleSuggestion = useCallback(
    (prompt: string) => {
      aui.thread.append({ content: [{ type: "text", text: prompt }] });
    },
    [aui],
  );

  return (
    <MessagePrimitive.Root className="mt-6">
      <div className="rounded-2xl rounded-bl-sm bg-[#F5D2AF]/80 px-4 py-2.5 text-sm text-[#3C5F32] shadow-sm backdrop-blur-sm">
        <ErrorPanel />
        <NodeProgressPanel messageId={messageId} />
        <MessageContent isUser={false} />
        <StoppedRunPanel onContinue={handleRegenerate} />
        {!isRunning && (
          <>
            <div className="flex flex-col">
              {getSuggestions().map((suggestion) => (
                <button
                  key={suggestion.prompt}
                  onClick={() => handleSuggestion(suggestion.prompt)}
                  className="mt-2 w-full rounded-lg border border-[#3C5F32]/20 bg-[#F5D2AF]/40 px-3 py-2 text-sm text-[#3C5F32]/70 hover:bg-[#E2DED9]/50 cursor-pointer transition-colors text-left">
                  {suggestion.title}
                </button>
              ))}
            </div>
            <MessageActions
              className="mt-2 justify-end"
              copied={isCopied}
              reaction={reaction}
              regenerating={false}
              onCopy={copy}
              onReactionChange={setReaction}
              onRegenerate={handleRegenerate}
            />
          </>
        )}
      </div>
    </MessagePrimitive.Root>
  );
};

export default AssistantMessage;
