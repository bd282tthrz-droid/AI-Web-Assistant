import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FabButton from "./fab-button";
import ChatDialogPanel from "./chat-dialog-panel";
import type { FC } from "react";
import { createDebugLogger } from "@/utils/debug-log";

// 聊天 Widget 顶层容器 - 管理 FAB + 对话框的打开/关闭状态
const debugLog = createDebugLogger("[chat-widget]");
const ChatWidget: FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    debugLog.log("load");
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      {/* 浮动按钮 */}

      <FabButton isOpen={isOpen} onToggle={handleToggle} />
      {/* 对话框 - 带缩放淡入/淡出动画 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="z-[2147483647] flex h-[500px] w-[380px] flex-col overflow-hidden rounded-xl border border-[#F5D2AF]/30 bg-[#3C5F32]/65 shadow-2xl shadow-black/30 backdrop-blur-xl"
            style={{ transformOrigin: "bottom right" }}
            initial={{ opacity: 0, scale: 0.5, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}>
            <ChatDialogPanel onClose={handleToggle} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
