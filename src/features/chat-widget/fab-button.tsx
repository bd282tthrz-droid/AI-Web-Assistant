import { Button } from "@heroui/react";
import { Ripple } from "m3-ripple";
import { motion } from "framer-motion";
import { type FC } from "react";
import { AiAssistantIcon } from "@/components/ui/ai-assistant-icon";
import { ICONS } from "@/constants/icon";

interface FabButtonProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly badgeCount: number;
}

const FabButton: FC<FabButtonProps> = ({ isOpen, onToggle, badgeCount }) => {
  return (
    <div className="fixed bottom-6 right-6 z-1">
      {!isOpen && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full bg-[#FF641E]"
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.4, 0, 0.4]
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut"
          }}
        />
      )}
      <Button
        isIconOnly
        variant="primary"
        onPress={onToggle}
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
        className={`relative h-14 w-14 rounded-full bg-[#FF641E] text-white shadow-lg shadow-[#FF641E]/30 transition-transform hover:scale-105 hover:bg-[#FF641E]/90 ${
          !isOpen ? "[&_svg]:h-7 [&_svg]:w-7" : ""
        }`}>
        <div className="relative">
          {isOpen ? <ICONS.close size={20} /> : <AiAssistantIcon size={28} />}
          {badgeCount > 0 && !isOpen && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          )}
        </div>
        <Ripple />
      </Button>
    </div>
  );
};

export default FabButton;