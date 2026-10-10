import { useEffect, type FC } from "react";
import useTypewriter from "@/hooks/use-typewriter";
import { useUserProfile } from "@/services/dify/user-profile-store";

interface TypewriterIntroProps {
  readonly onTypingDone: () => void;
}

const TypewriterIntro: FC<TypewriterIntroProps> = ({ onTypingDone }) => {
  const name = useUserProfile((s) => s.name);

  const INTRO_TEXT = name
    ? `👋 Welcome back, ${name}! How can I help you today?`
    : "👋 Hello! I am your website's AI assistant. I can help you find products, answer questions. Feel free to ask me anything! To better serve you, may I ask how I should address you?";

  const { deferredData, isTyping } = useTypewriter({
    inputText: INTRO_TEXT,
    speed: 30,
    chunkSize: 1,
  });

  useEffect(() => {
    if (!isTyping) onTypingDone();
  }, [isTyping, onTypingDone]);

  return (
    <p className="min-h-[1.5em] w-full text-[#F5D2AF]/80">
      {deferredData}
      {isTyping && <span className="ml-0.5 animate-pulse">|</span>}
    </p>
  );
};

export default TypewriterIntro;