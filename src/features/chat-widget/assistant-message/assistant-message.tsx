import { MessagePrimitive } from "@assistant-ui/react";
import { useActionBarCopy } from "@assistant-ui/core/react";
import { useActionBarReload } from "@assistant-ui/core/react";
import { useAuiState } from "@assistant-ui/store";
import { memo, useCallback, type FC } from "react";
import { MessageActions } from "@/components/elements/message-actions";
import { useMessageFeedback } from "./use-message-feedback";
import { useMessageRunState } from "./use-message-run-state";
import NodeProgressPanel from "./node-progress-panel";
import ErrorPanel from "./error-panel";
import StoppedRunPanel from "./stopped-run-panel";
import SuggestionButtons from "./suggestion-buttons";
import PageSummaryCard from "./page-summary-card";
import { MessageContent } from "../message-content";
import { createDebugLogger } from "@/utils/debug-log";

interface AssistantMessageProps {
  readonly messageId?: string;
  readonly turnId?: string;
  readonly keyIndex?: number;
}
const debugLog = createDebugLogger("[assistant-message]");
const AssistantMessage: FC<AssistantMessageProps> = ({ messageId, turnId, keyIndex }) => {
  //debugLog.log("render", { messageId, turnId, keyIndex });
  const { reaction, handleReaction } = useMessageFeedback(messageId ?? "");
  useMessageRunState();
  const isRunning = useAuiState((s) => s.thread.isRunning);
  // 页面总结回复消息 → 渲染 Inline 询价卡片
  const isPageSummary = useAuiState((s) => s.message.metadata?.custom?.pageSummary === true);
  // 消息流式状态：文字输出完毕（complete）后才显示卡片
  const messageStatus = useAuiState((s) => s.message.status);
  const isMessageComplete = messageStatus?.type === "complete";

  const { copy, isCopied } = useActionBarCopy({
    copyToClipboard: async (text: string) => {
      await navigator.clipboard.writeText(text);
    }
  });
  const { reload, disabled: reloadDisabled } = useActionBarReload();

  const handleRegenerate = useCallback(() => {
    if (!reloadDisabled) reload();
  }, [reload, reloadDisabled]);

  return (
    <MessagePrimitive.Root className="mt-6">
      <div className="rounded-2xl rounded-bl-sm bg-[#F5D2AF]/80 px-4 py-2.5 text-sm text-[#3C5F32] shadow-sm backdrop-blur-sm">
        <ErrorPanel turnId={turnId} />
        <NodeProgressPanel messageId={messageId ?? ""} keyIndex={keyIndex} />
        <MessageContent isUser={false} />
        {isPageSummary && isMessageComplete && (
          <>
            <PageSummaryCard />
          </>
        )}
        <StoppedRunPanel onContinue={handleRegenerate} />
        {!isRunning && (
          <>
            <SuggestionButtons />
            <MessageActions
              className="mt-2 justify-end"
              copied={isCopied}
              reaction={reaction}
              regenerating={false}
              onCopy={copy}
              onReactionChange={handleReaction}
              onRegenerate={handleRegenerate}
            />
          </>
        )}
      </div>
    </MessagePrimitive.Root>
  );
};

export default memo(AssistantMessage);
