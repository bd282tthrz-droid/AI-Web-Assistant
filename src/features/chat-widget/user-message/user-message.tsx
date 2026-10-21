import { memo, type FC } from "react";
import { MessagePrimitive } from "@assistant-ui/react";
import { useActionBarCopy } from "@assistant-ui/core/react";
import { MessageActions } from "@/components/elements/message-actions";
import { MessageContent } from "@/features/chat-widget/message-content";
import { createDebugLogger } from "@/utils/debug-log";

const debugLog = createDebugLogger("[chat-message-item]");

const UserMessage: FC = () => {
  const { copy, isCopied } = useActionBarCopy({
    copyToClipboard: async (text: string) => {
      await navigator.clipboard.writeText(text);
    }
  });
  return (
    <MessagePrimitive.Root className="flex flex-col items-end mt-6">
      <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[#FF641E]/85 px-4 py-2.5 text-sm text-white shadow-sm backdrop-blur-sm">
        <MessageContent />
      </div>
      <MessageActions className="justify-end text-white" copied={isCopied} helpful={false} onCopy={copy} />
    </MessagePrimitive.Root>
  );
};

export default memo(UserMessage);
