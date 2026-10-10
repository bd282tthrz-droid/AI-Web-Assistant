import { ThreadPrimitive, AuiIf } from "@assistant-ui/react";
import { useState, useCallback, type FC } from "react";
import { TwitchIcon } from "@/components/ui/twitch";
import { UserMessage } from "@/features/chat-widget/user-message";
import { AssistantMessage } from "@/features/chat-widget/assistant-message";
import { useUserProfile } from "@/services/dify/user-profile-store";
import TypewriterIntro from "./typewriter-intro";
import InfoCard from "./info-card";
import SuggestionList from "./suggestion-list";

import { createDebugLogger } from "@/utils/debug-log";
const debugLog = createDebugLogger("[chat-messages]");

const ChatMessages: FC = () => {
  const [showCard, setShowCard] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const hasEmail = useUserProfile((s) => s.hasEmail);

  const handleTypingDone = useCallback(() => {
    if (hasEmail) {
      // 有邮箱：打字结束直接显示建议按钮
      setShowSuggestions(true);
    } else {
      // 无邮箱：先显示信息卡片
      setShowCard(true);
    }
  }, [hasEmail]);

  const handleInfoDone = useCallback(() => {
    setShowCard(false);
    setShowSuggestions(true);
  }, []);
  debugLog.log(showCard);
  return (
    <div className="relative flex-1 overflow-hidden">
      <ThreadPrimitive.Viewport className="h-full px-4 overflow-y-auto custom-scrollbar" autoScroll>
        <ThreadPrimitive.Messages>
          {({ message }) => (message.role === "user" ? <UserMessage /> : <AssistantMessage messageId={message.id} />)}
        </ThreadPrimitive.Messages>
      </ThreadPrimitive.Viewport>

      <AuiIf condition={(s) => s.thread.isEmpty}>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 text-[#F5D2AF]/60">
          <TwitchIcon loop={true} size={32} />
          <TypewriterIntro onTypingDone={handleTypingDone} />
          <SuggestionList visible={showSuggestions} />
        </div>
      </AuiIf>

      {/* 弹窗浮在容器上，不受 pointer-events-none 影响 */}
      {showCard && <InfoCard onDone={handleInfoDone} />}
    </div>
  );
};

export default ChatMessages;
