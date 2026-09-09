import { useCallback, memo, forwardRef, type HTMLAttributes } from "react";
import { Virtuoso } from "react-virtuoso";
import { ThreadPrimitive } from "@assistant-ui/react";
import { useAuiState } from "@assistant-ui/store";
import { useThreadMessageIds } from "@/hooks/use-thread-message-ids";
import { UserMessage, AssistantMessage } from "../chat-message-item";
import { useAutoScroll } from "./hook";

// 虚拟消息列表组件
// 使用 react-virtuoso + ThreadPrimitive.Unstable_MessageById
// 流式输出的消息通过 Virtuoso 的 Footer 渲染，不在虚拟化范围内
// 历史消息由 Virtuoso 虚拟化渲染，互不干扰

// 消息组件配置（UserMessage + AssistantMessage，由 Unstable_MessageById 根据 role 自动选择）
const MESSAGE_COMPONENTS = {
  UserMessage,
  AssistantMessage
};

// 自定义 Scroller，用于应用滚动条样式
const Scroller = forwardRef<HTMLDivElement, HTMLAttributes<HTMLElement>>(function Scroller({ children, ...props }, ref) {
  return (
    <div {...props} ref={ref} className="custom-scrollbar">
      {children}
    </div>
  );
});

// 自定义 List（virtuoso-item-list），用于控制消息列表布局
const List = forwardRef<HTMLDivElement, HTMLAttributes<HTMLElement>>(function List({ children, ...props }, ref) {
  return (
    <div {...props} ref={ref} className="custom-list">
      {children}
    </div>
  );
});

const VirtualMessageList = memo(() => {
  const messageIds = useThreadMessageIds();
  const isRunning = useAuiState((s) => s.thread.isRunning);

  // 流式输出时，最后一条消息用 Footer 渲染（不在虚拟化范围内）
  const hasStreaming = isRunning && messageIds.length >= 2;
  const streamingId = hasStreaming ? messageIds[messageIds.length - 1] : null;
  const virtuosoIds = hasStreaming ? messageIds.slice(0, -1) : messageIds;

  const { virtuosoRef, scrollerRef, setFooterEl } = useAutoScroll(messageIds, streamingId);

  // Footer：正在流式输出的消息
  const Footer = useCallback(() => {
    if (!streamingId) return <div className="mb-6"></div>;
    return (
      <div ref={setFooterEl} className="pb-12">
        <ThreadPrimitive.Unstable_MessageById messageId={streamingId} components={MESSAGE_COMPONENTS} />
      </div>
    );
  }, [streamingId]);

  // 按索引渲染历史消息
  const itemContent = useCallback(
    (index: number) => {
      const messageId = virtuosoIds[index];
      if (!messageId) return null;
      return <ThreadPrimitive.Unstable_MessageById messageId={messageId} components={MESSAGE_COMPONENTS} />;
    },
    [virtuosoIds]
  );

  return (
    <Virtuoso
      ref={virtuosoRef}
      scrollerRef={(ref) => {
        scrollerRef.current = ref as HTMLElement | null;
      }}
      components={{ Footer, Scroller, List }}
      className="h-full py-3"
      totalCount={virtuosoIds.length}
      itemContent={itemContent}
      overscan={200}
      defaultItemHeight={80}
    />
  );
});

export default VirtualMessageList;
