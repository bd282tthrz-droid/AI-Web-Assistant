import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FabButton from "./fab-button";
import ChatDialogPanel from "./chat-dialog-panel";
import MouseHint from "./mouse-hint";
import FormHint from "./form-hint";
import { FormFillProvider } from "./form-fill-context";
import { QueryProvider } from "@/providers/QueryProvider";
import { useNewMessageStore } from "@/services/dify/new-message-store";
import { getProfileSync } from "@/services/dify/user-profile-store";
import { clearCurrentSession } from "@/services/dify/dify-conversation";
import type { FC } from "react";
import { createDebugLogger } from "@/utils/debug-log";
import { APP_ENV } from "@/constants/api";

// 聊天 Widget 顶层容器 - 管理 FAB + 对话框的打开/关闭/最小化状态 + 表单提示
const debugLog = createDebugLogger("[chat-widget]");
const ChatWidget: FC = () => {
  const [isOpen, setIsOpen] = useState(!APP_ENV.IS_DEV);
  const [isMinimized, setIsMinimized] = useState(false);
  const [pendingFormType, setPendingFormType] = useState<string | null>(null);
  const badgeCount = useNewMessageStore((s) => s.count);

  const handleToggle = useCallback(() => {
    debugLog.log("load");
    if (isMinimized) {
      useNewMessageStore.getState().reset();
      setIsMinimized(false);
      return;
    }
    setIsOpen((prev) => !prev);
  }, [isMinimized]);

  const handleOpen = useCallback(() => {
    useNewMessageStore.getState().reset();
    setPendingFormType(null);
    setIsMinimized(false);
    setIsOpen(true);
  }, []);

  const handleFormOpen = useCallback((formType?: string) => {
    useNewMessageStore.getState().reset();
    setPendingFormType(formType ?? null);
    setIsMinimized(false);
    setIsOpen(true);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const handleClose = useCallback(() => {
    useNewMessageStore.getState().reset();
    setIsMinimized(false);
    setIsOpen(false);
    // 无 email 时清除会话 ID，避免关闭后恢复旧对话
    if (!getProfileSync().email) {
      clearCurrentSession();
    }
  }, []);

  return (
    <QueryProvider>
      {/* 浮动按钮 */}

      <FabButton isOpen={isOpen && !isMinimized} onToggle={handleToggle} badgeCount={badgeCount} />
      {/* 对话框关闭且非最小化时显示鼠标跟随浮标 */}
      {!isOpen && !isMinimized && <MouseHint onOpen={handleOpen} />}
      {/* 核心已加载后，始终显示表单悬停提示 */}
      <FormHint onOpen={handleFormOpen} />
      {/* 对话框 - 最小化时不卸载，仅 hidden */}
      <AnimatePresence>
        {(isOpen || isMinimized) && (
          <motion.div
            className={`chat-dialog-glass flex h-screen w-[380px] flex-col overflow-hidden border border-white/15 bg-[#3C5F32]/80 shadow-2xl shadow-black/30 backdrop-blur-2xl z-10${
              isMinimized ? " hidden" : ""
            }`}
            style={{ transformOrigin: "bottom right" }}
            initial={{ opacity: 0, scale: 0.5, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}>
            <FormFillProvider value={pendingFormType}>
              <ChatDialogPanel onClose={handleClose} onMinimize={handleMinimize} />
            </FormFillProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </QueryProvider>
  );
};

export default ChatWidget;
