import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FabButton from "./fab-button";
import ChatDialogPanel from "./chat-dialog-panel";
import MouseHint from "./mouse-hint";
import FormHint from "./form-hint";
import { FormFillProvider } from "./form-fill-context";
import { QueryProvider } from "@/providers/QueryProvider";
import type { FC } from "react";
import { createDebugLogger } from "@/utils/debug-log";
import { APP_ENV } from "@/constants/api";

// 聊天 Widget 顶层容器 - 管理 FAB + 对话框的打开/关闭状态 + 表单提示
const debugLog = createDebugLogger("[chat-widget]");
const ChatWidget: FC = () => {
  const [isOpen, setIsOpen] = useState(!APP_ENV.IS_DEV);
  const [pendingFormType, setPendingFormType] = useState<string | null>(null);

  const handleToggle = useCallback(() => {
    debugLog.log("load");
    setIsOpen((prev) => !prev);
  }, []);

  const handleOpen = useCallback(() => {
    setPendingFormType(null);
    setIsOpen(true);
  }, []);

  const handleFormOpen = useCallback((formType?: string) => {
    setPendingFormType(formType ?? null);
    setIsOpen(true);
  }, []);

  return (
    <QueryProvider>
      {/* 浮动按钮 */}

      <FabButton isOpen={isOpen} onToggle={handleToggle} />
      {/* 对话框关闭时显示鼠标跟随浮标 */}
      {!isOpen && <MouseHint onOpen={handleOpen} />}
      {/* 核心已加载后，始终显示表单悬停提示 */}
      <FormHint onOpen={handleFormOpen} />
      {/* 对话框 - 带缩放淡入/淡出动画 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-dialog-glass flex h-screen w-[380px] flex-col overflow-hidden border border-white/15 bg-[#3C5F32]/80 shadow-2xl shadow-black/30 backdrop-blur-2xl z-2"
            style={{ transformOrigin: "bottom right" }}
            initial={{ opacity: 0, scale: 0.5, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}>
            <FormFillProvider value={pendingFormType}>
              <ChatDialogPanel onClose={handleToggle} />
            </FormFillProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </QueryProvider>
  );
};

export default ChatWidget;
