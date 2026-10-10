import { MessagePrimitive } from "@assistant-ui/react";
import { useActionBarCopy } from "@assistant-ui/core/react";
import { useActionBarReload } from "@assistant-ui/core/react";
import { useAuiState } from "@assistant-ui/store";
import { useCallback, type FC } from "react";
import { MessageActions } from "@/components/elements/message-actions";
import { useMessageFeedback } from "./use-message-feedback";
import { useMessageRunState } from "./use-message-run-state";
import NodeProgressPanel from "./node-progress-panel";
import ErrorPanel from "./error-panel";
import StoppedRunPanel from "./stopped-run-panel";
import SuggestionButtons from "./suggestion-buttons";
import { MessageContent } from "../message-content";

interface AssistantMessageProps {
  readonly messageId: string;
}

const AssistantMessage: FC<AssistantMessageProps> = ({ messageId }) => {
  const { reaction, handleReaction } = useMessageFeedback(messageId);
  useMessageRunState();
  const isRunning = useAuiState((s) => s.thread.isRunning);

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
        <ErrorPanel />
        <NodeProgressPanel messageId={messageId} />
        <MessageContent isUser={false} />
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

export default AssistantMessage;