import { useEffect, useRef, useState, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PAGE_TEXT_SELECTORS } from "@/constants/page-summary";

// 鼠标跟随浮标 - 助手关闭时在鼠标位置显示 "❓ Ask AI"
// 与 fab-bootstrap.ts 中的预加载浮标完全独立
// 仅在核心已加载、对话框关闭时激活

interface MouseHintProps {
  readonly onOpen: () => void;
}

const IDLE_DELAY = 600; // 鼠标静止多久后显示 (ms)
const HIDE_DELAY = 400; // 鼠标移动后多久隐藏 (ms)

const MouseHint: FC<MouseHintProps> = ({ onOpen }) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOverRef = useRef(false);
  const posRef = useRef({ x: 0, y: 0 });
  const visibleRef = useRef(false);
  const hintRef = useRef<HTMLDivElement | null>(null);

  const clearTimers = () => {
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const showHint = () => {
    setPos({ ...posRef.current });
    setVisible(true);
    visibleRef.current = true;
  };

  const hideHint = () => {
    setVisible(false);
    visibleRef.current = false;
  };

  // 鼠标移动事件 - document 层监听
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };

      // 鼠标停在浮标上，不触发任何计时
      if (isOverRef.current) return;

      // 正文区域由 PageSummaryHint（📄 Summarize page）接管，Ask AI 不在此显示
      const target = e.target as HTMLElement;
      if (target.closest?.(PAGE_TEXT_SELECTORS)) {
        clearTimers();
        if (visibleRef.current) hideHint();
        return;
      }

      clearTimers();

      if (visibleRef.current) {
        // 浮标可见 → 延时隐藏
        hideTimerRef.current = setTimeout(hideHint, HIDE_DELAY);
      } else {
        // 浮标隐藏 → 检测静止后显示
        idleTimerRef.current = setTimeout(showHint, IDLE_DELAY);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      clearTimers();
    };
  }, []); // 空依赖：ref 避免了闭包陈旧问题

  // 浮标元素事件 - 使用原生 DOM 绑定而非 React 合成事件
  // 解决 Shadow DOM 中 React onMouseEnter/onMouseLeave 事件委托不工作的问题
  useEffect(() => {
    const el = hintRef.current;
    if (!el || !visible) return;

    const onEnter = () => {
      isOverRef.current = true;
      clearTimers();
    };

    const onLeave = () => {
      isOverRef.current = false;
      hideTimerRef.current = setTimeout(hideHint, HIDE_DELAY);
    };

    const onClick = () => {
      clearTimers();
      hideHint();
      onOpen();
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("click", onClick);

    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("click", onClick);
    };
  }, [onOpen, visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={hintRef}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.85, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "fixed",
            left: pos.x + 15,
            top: pos.y + 15,
            zIndex: 2147483646,
            cursor: "pointer"
          }}
          className="select-none whitespace-nowrap rounded-md bg-white/85 px-2.5 py-1 text-sm text-[#FF641E] shadow-sm backdrop-blur-sm">
          ❓ Ask AI
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MouseHint;
