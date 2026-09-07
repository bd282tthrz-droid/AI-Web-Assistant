import { Button } from "@heroui/react";
import { Ripple } from "m3-ripple";
import { ICONS } from "@/constants/icon";
import ChatDialog from "./chat-dialog";
import type { FC } from "react";
import { createDebugLogger } from "@/utils/debug-log";

interface ChatDialogPanelProps {
  readonly onClose: () => void;
}
const debugLog = createDebugLogger("[chat-dialog-panel]");
// 对话框面板 - header + 对话内容
// 不包含动画逻辑，由父组件 chat-widget 控制出现/消失动画
const ChatDialogPanel: FC<ChatDialogPanelProps> = ({ onClose }) => {
  debugLog.log("load");
  return (
    <>
      <header className="flex items-center justify-between border-b border-[#F5D2AF]/20 bg-[#3C5F32]/65 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <ICONS.robot size={20} className="text-[#F5D2AF]" />
          <h2 className="text-sm font-semibold text-[#F5D2AF]">AI Assistant</h2>
        </div>
        <Button isIconOnly variant="ghost" size="sm" onPress={onClose} aria-label="Close dialog" className="text-[#F5D2AF] hover:bg-[#FF641E]/20">
          <ICONS.close size={16} />
          <Ripple />
        </Button>
      </header>
      <div className="flex-1 overflow-hidden">
        <ChatDialog />
      </div>
    </>
  );
};

export default ChatDialogPanel;
