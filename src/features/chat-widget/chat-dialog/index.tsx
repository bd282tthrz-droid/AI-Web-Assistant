import { AssistantRuntimeProvider, ThreadPrimitive } from "@assistant-ui/react";
import { useAssistant } from "@/hooks/use-assistant";
import { useConversationHistory } from "@/hooks/use-conversation-history";
import { type FC } from "react";
import ChatMessages from "./chat-messages";
import ChatComposer from "./chat-composer";
import SummaryRequestTrigger from "../summary-request-trigger";

const ChatDialog: FC = () => {
  const { messageRepository } = useConversationHistory();
  const { runtime, config } = useAssistant(messageRepository);

  return (
    <AssistantRuntimeProvider runtime={runtime} config={config}>
      <ThreadPrimitive.Root className="flex h-full flex-col">
        <SummaryRequestTrigger />
        <ChatMessages />
        <ChatComposer />
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  );
};

export default ChatDialog;
