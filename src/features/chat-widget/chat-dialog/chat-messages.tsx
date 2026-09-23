import { ThreadPrimitive, AuiIf } from "@assistant-ui/react";
import { type FC } from "react";
import { TwitchIcon } from "@/components/ui/twitch";
import { UserMessage } from "@/features/chat-widget/user-message";
import { AssistantMessage } from "@/features/chat-widget/assistant-message";
import { SUGGESTIONS } from "@/constants/suggestion";

const ChatMessages: FC = () => {
  return (
    <div className="relative flex-1 overflow-hidden">
      <ThreadPrimitive.Viewport className="h-full px-4 overflow-y-auto custom-scrollbar" autoScroll>
        <ThreadPrimitive.Messages>
          {({ message }) => (message.role === "user" ? <UserMessage /> : <AssistantMessage messageId={message.id} />)}
        </ThreadPrimitive.Messages>
      </ThreadPrimitive.Viewport>

      <AuiIf condition={(s) => s.thread.isEmpty}>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#F5D2AF]/60">
          <TwitchIcon loop={true} size={32} />
          <p className="text-lg my-4">How can I help you?</p>
          <div className="pointer-events-auto mt-2 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <ThreadPrimitive.Suggestion
                key={suggestion.prompt}
                className="rounded-lg border border-[#F5D2AF]/40 bg-[#F5D2AF]/20 px-4 py-1 text-sm text-[#F5D2AF]/80 backdrop-blur-sm hover:bg-[#F5D2AF]/30 cursor-pointer transition-colors"
                prompt={suggestion.prompt}
                send>
                {suggestion.title}
              </ThreadPrimitive.Suggestion>
            ))}
            {/*  <ThreadPrimitive.Suggestion
              prompt="Show me popular products"
              send
              className="rounded-lg border border-[#F5D2AF]/40 bg-[#F5D2AF]/20 px-4 py-1 text-sm text-[#F5D2AF]/80 backdrop-blur-sm hover:bg-[#F5D2AF]/30 cursor-pointer transition-colors">
              🔥 Popular Products
            </ThreadPrimitive.Suggestion>
            <ThreadPrimitive.Suggestion
              prompt="What's your return policy?"
              send
              className="rounded-lg border border-[#F5D2AF]/40 bg-[#F5D2AF]/20 px-4 py-1 text-sm text-[#F5D2AF]/80 backdrop-blur-sm hover:bg-[#F5D2AF]/30 cursor-pointer transition-colors">
              📦 Return Policy
            </ThreadPrimitive.Suggestion>
            <ThreadPrimitive.Suggestion
              prompt="Any ongoing promotions?"
              send
              className="rounded-lg border border-[#F5D2AF]/40 bg-[#F5D2AF]/20 px-4 py-1 text-sm text-[#F5D2AF]/80 backdrop-blur-sm hover:bg-[#F5D2AF]/30 cursor-pointer transition-colors">
              🏷️ Promotions
            </ThreadPrimitive.Suggestion> */}
          </div>
        </div>
      </AuiIf>
    </div>
  );
};

export default ChatMessages;
