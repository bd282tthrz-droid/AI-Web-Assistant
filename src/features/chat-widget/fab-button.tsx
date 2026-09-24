import { Button } from "@heroui/react";
import { Ripple } from "m3-ripple";
import { motion } from "framer-motion";
import { type FC } from "react";
import { AiAssistantIcon } from "@/components/ui/ai-assistant-icon";
import { ICONS } from "@/constants/icon";

// FAB 浮动按钮 Props（内部 UI 类型，用 TS 原生）
interface FabButtonProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
}

// 浮动操作按钮 - 点击打开/关闭聊天对话框
// 固定定位在右下角，z-index 最高确保不被遮挡
const FabButton: FC<FabButtonProps> = ({ isOpen, onToggle }) => {
  return (
    <div className="fixed bottom-6 right-6 z-1">
      {/* 外层呼吸光环 */}
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
        {isOpen ? <ICONS.close size={20} /> : <AiAssistantIcon size={28} />}
        <Ripple />
      </Button>
    </div>
  );
};

export default FabButton;
