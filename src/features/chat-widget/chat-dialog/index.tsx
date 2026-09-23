import { AssistantRuntimeProvider, ThreadPrimitive } from "@assistant-ui/react";
import { useAssistant } from "@/hooks/use-assistant";
import { type FC } from "react";
import ChatMessages from "./chat-messages";
import ChatComposer from "./chat-composer";

const ChatDialog: FC = () => {
  const { runtime, config } = useAssistant();
  return (
    <AssistantRuntimeProvider runtime={runtime} config={config}>
      <ThreadPrimitive.Root className="flex h-full flex-col">
        <ChatMessages />
        <ChatComposer />
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  );
};

export default ChatDialog;
