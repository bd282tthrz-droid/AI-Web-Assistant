// 虚拟列表自动滚动逻辑
// 新消息到达 → 无条件滚动到底部
// 流式输出 → 用户在底部附近时才跟随（阈值判断）
// 用户手动滚动 → 超过阈值后自动停止
import { useEffect, useRef, useState } from "react";
import type { VirtuosoHandle } from "react-virtuoso";

export function useAutoScroll(messageIds: readonly string[], streamingId: string | null) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const scrollerRef = useRef<HTMLElement | null>(null);
  const [footerEl, setFooterEl] = useState<HTMLDivElement | null>(null);

  // 新消息到达 或 流式输出结束 → 无条件滚动到底部
  useEffect(() => {
    if (messageIds.length === 0) return;
    const rafId = requestAnimationFrame(() => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const { scrollHeight, clientHeight } = scroller;
      scroller.scrollTo({ top: scrollHeight - clientHeight, behavior: "auto" });
    });
    return () => cancelAnimationFrame(rafId);
  }, [messageIds.length, streamingId]);

  // 流式输出 → 用户在底部附近时才跟随
  useEffect(() => {
    if (!footerEl || !streamingId) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const observer = new ResizeObserver(() => {
      const { scrollTop, scrollHeight, clientHeight } = scroller;
      // 用户处于底部附近时自动跟随
      if (scrollHeight - scrollTop - clientHeight < 100) {
        scroller.scrollTo({
          top: scrollHeight - clientHeight,
          behavior: "smooth"
        });
      }
    });

    observer.observe(footerEl);
    return () => observer.disconnect();
  }, [streamingId, footerEl]);

  return {
    virtuosoRef,
    scrollerRef,
    setFooterEl
  };
}
