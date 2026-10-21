// 页面总结悬停提示组件
// 核心已加载后，鼠标悬停在页面正文文字上时显示 "📄 Summarize page" 浮标
// 点击浮标 → 打开对话框 + 自动请求 Dify 总结页面内容
// 与 MouseHint（❓ Ask AI）协调：正文区域由本组件接管，非正文区域仍显示 Ask AI

import { useEffect, useRef, useState, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PAGE_TEXT_SELECTORS } from "@/constants/page-summary";

interface PageSummaryHintProps {
  readonly onSummarize: () => void;
}

const PageSummaryHint: FC<PageSummaryHintProps> = ({ onSummarize }) => {
  const [hint, setHint] = useState<{ x: number; y: number } | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);
  const currentElRef = useRef<HTMLElement | null>(null);
  const isOverHintRef = useRef(false);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // document mouseover/mouseout 委托检测正文文本元素
  useEffect(() => {
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // 命中正文文本元素（自身或祖先）
      const textEl = target.closest(PAGE_TEXT_SELECTORS) as HTMLElement | null;
      if (!textEl) return;

      currentElRef.current = textEl;
      const rect = textEl.getBoundingClientRect();
      const OFFSET = 12;
      const HINT_W = 120;
      const HINT_H = 30;

      // 字段附近定位 + 视口裁剪（与 FormHint 一致）
      let hintX = Math.max(rect.left + OFFSET, Math.min(e.clientX, rect.right - HINT_W));
      let hintY = e.clientY + OFFSET < rect.bottom - HINT_H ? e.clientY + OFFSET : rect.top - HINT_H;
      hintX = Math.max(4, Math.min(hintX, window.innerWidth - HINT_W - 4));
      hintY = Math.max(4, hintY);
      setHint({ x: hintX, y: hintY });

      if (leaveTimerRef.current !== null) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = null;
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const textEl = target.closest(PAGE_TEXT_SELECTORS);
      if (!textEl) return;

      // 延时隐藏（给用户移动到浮标的时间）
      leaveTimerRef.current = setTimeout(() => {
        setHint(null);
        currentElRef.current = null;
      }, 300);
    };

    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseout", onMouseOut);
    return () => {
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
      if (leaveTimerRef.current !== null) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  // 浮标元素事件 - 原生 DOM 绑定（Shadow DOM 兼容）
  useEffect(() => {
    const el = hintRef.current;
    if (!el || !hint) return;

    const onEnter = () => {
      isOverHintRef.current = true;
      if (leaveTimerRef.current !== null) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = null;
      }
    };

    const onLeave = () => {
      isOverHintRef.current = false;
      leaveTimerRef.current = setTimeout(() => {
        setHint(null);
        currentElRef.current = null;
      }, 300);
    };

    const onClick = () => {
      setHint(null);
      currentElRef.current = null;
      onSummarize();
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("click", onClick);

    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("click", onClick);
    };
  }, [hint, onSummarize]);

  return (
    <AnimatePresence>
      {hint && (
        <motion.div
          ref={hintRef}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 0.9, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.12 }}
          style={{
            position: "fixed",
            left: hint.x,
            top: hint.y,
            zIndex: 2147483646,
            cursor: "pointer",
            pointerEvents: "auto"
          }}
          className="select-none whitespace-nowrap rounded-md border border-[#FF641E]/20 bg-white/90 px-2.5 py-1 text-sm text-[#FF641E] shadow-sm backdrop-blur-sm">
          📄 Summarize page
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageSummaryHint;