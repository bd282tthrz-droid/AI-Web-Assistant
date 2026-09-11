import { AssistantRuntimeProvider, ThreadPrimitive, ComposerPrimitive, AuiIf } from "@assistant-ui/react";
import { useAssistant } from "@/hooks/use-assistant";
import { ICONS } from "@/constants/icon";
import { UserMessage, AssistantMessage } from "./chat-message-item";
import type { FC } from "react";

// 对话区域组件 - 消息列表渲染
// 使用 ThreadPrimitive.Viewport + Messages 官方方案
// Viewport 自带 autoScroll 自动跟随流式输出
// AuiIf 处理空状态
const ChatMessages: FC = () => {
  return (
    <div className="relative flex-1 overflow-hidden">
      <ThreadPrimitive.Viewport
        className="h-full px-4 overflow-y-auto custom-scrollbar"
        autoScroll
      >
        <ThreadPrimitive.Messages>
          {({ message }) =>
            message.role === "user" ? <UserMessage /> : <AssistantMessage />
          }
        </ThreadPrimitive.Messages>
      </ThreadPrimitive.Viewport>

      <AuiIf condition={(s) => s.thread.isEmpty}>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#F5D2AF]/60">
          <ICONS.message size={32} />
          <p className="text-lg my-4">How can I help you?</p>
          <div className="pointer-events-auto mt-2 flex flex-wrap justify-center gap-2">
            <ThreadPrimitive.Suggestion
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
            </ThreadPrimitive.Suggestion>
          </div>
        </div>
      </AuiIf>
    </div>
  );
};

// 输入区域组件 - 输入框 + 发送按钮
const ChatComposer: FC = () => {
  return (
    <ComposerPrimitive.Root className="flex items-end gap-2 border-t border-white/10 bg-[#3C5F32]/40 p-3 backdrop-blur-lg">
      <ComposerPrimitive.Input
        placeholder="Type a message..."
        submitMode="enter"
        className="flex-1 resize-none rounded-lg border border-[#F5D2AF]/40 bg-[#F5D2AF] px-3 py-2 text-sm text-[#3C5F32] outline-none placeholder:text-[#3C5F32]/50"
        rows={1}
      />
      <ComposerPrimitive.Send className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF641E] text-white hover:bg-[#FF641E]/90 disabled:opacity-40">
        <ICONS.paperPlane size={16} />
      </ComposerPrimitive.Send>
    </ComposerPrimitive.Root>
  );
};

// 聊天对话框组件 - 集成 assistant-ui Thread + Composer
// config 必须传入，AuiProvider 才会渲染 <Tools> resource，注册 toolkit 的 render 组件
// 否则 tool-call part 渲染时找不到 ConfirmToolUI，human tool 确认弹窗不会出现
const ChatDialog: FC = () => {
  const { runtime, config } = useAssistant();
  return (
    <AssistantRuntimeProvider runtime={runtime} config={config}>
      <ThreadPrimitive.Root className="flex h-full flex-col">
        <ChatMessages />
        <ChatComposer />
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  );
};

export default ChatDialog;
