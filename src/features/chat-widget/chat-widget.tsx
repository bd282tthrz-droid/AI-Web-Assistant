import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FabButton from "./fab-button";
import ChatDialogPanel from "./chat-dialog-panel";
import MouseHint from "./mouse-hint";
import type { FC } from "react";
import { createDebugLogger } from "@/utils/debug-log";
import { APP_ENV } from "@/constants/api";

// 聊天 Widget 顶层容器 - 管理 FAB + 对话框的打开/关闭状态
const debugLog = createDebugLogger("[chat-widget]");
const ChatWidget: FC = () => {
  const [isOpen, setIsOpen] = useState(!APP_ENV.IS_DEV);

  const handleToggle = useCallback(() => {
    debugLog.log("load");
    setIsOpen((prev) => !prev);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  return (
    <>
      {/* 浮动按钮 */}

      <FabButton isOpen={isOpen} onToggle={handleToggle} />
      {/* 对话框关闭时显示鼠标跟随浮标 */}
      {!isOpen && <MouseHint onOpen={handleOpen} />}
      {/* 对话框 - 带缩放淡入/淡出动画 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-dialog-glass flex h-[600px] w-[380px] flex-col overflow-hidden rounded-xl border border-white/15 bg-[#3C5F32]/80 shadow-2xl shadow-black/30 backdrop-blur-2xl"
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
