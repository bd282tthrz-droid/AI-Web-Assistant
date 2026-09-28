// 表单悬停提示组件
// 核心已加载后，用户鼠标悬停在表单字段上时显示对应提示浮标
// 搜索表单 → 🔍 Search | 其他表单 → ✨ Auto-fill
// 点击浮标 → 打开对话框 + 标记表单类型（composer 预填充对应提示文本）

import { useEffect, useRef, useState, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FORM_SELECTORS = "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=checkbox]):not([type=radio]), textarea";

type FormType = "search" | "form";

const HINT_LABELS: Record<FormType, string> = {
  search: "🔍 AI Search",
  form: "✨ AI Auto-fill"
};

// 匹配表单元素的关键词
const matchKeywords = (el: Element, keywords: readonly string[]): boolean => {
  const source = [
    (el as HTMLInputElement).name,
    (el as HTMLInputElement).type,
    el.id,
    el.className,
    el.getAttribute("placeholder"),
    el.getAttribute("aria-label")
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return keywords.some((k) => source.includes(k));
};

// 检测表单类型：搜索表单 vs 其他表单
const detectFormType = (el: HTMLElement): FormType => {
  // 1. 输入框自身 type=search 或 role=search
  if ((el as HTMLInputElement).type === "search") return "search";
  if (el.closest("[role='search']")) return "search";

  // 2. 字段或祖先含 search 关键词
  if (matchKeywords(el, ["search"])) return "search";

  const form = el.closest("form");
  const formSource = form ? [form.className, form.id, form.getAttribute("role")].filter(Boolean).join(" ").toLowerCase() : "";
  if (formSource.includes("search")) return "search";

  // 3. form 内只有一个非隐藏输入 → 搜索
  if (form) {
    const inputs = Array.from(form.querySelectorAll(FORM_SELECTORS));
    if (inputs.length <= 1) return "search";
  }

  return "form";
};

interface FormHintProps {
  readonly onOpen: (formType?: string) => void;
}

const FormHint: FC<FormHintProps> = ({ onOpen }) => {
  const [hint, setHint] = useState<{ x: number; y: number } | null>(null);
  const [formType, setFormType] = useState<FormType>("form");
  const hintRef = useRef<HTMLDivElement | null>(null);
  const currentFieldRef = useRef<HTMLElement | null>(null);
  const isOverHintRef = useRef(false);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // document mouseover/mouseout 委托检测表单字段
  useEffect(() => {
    const onMouseOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el?.matches?.(FORM_SELECTORS)) return;

      currentFieldRef.current = el;
      setFormType(detectFormType(el));
      const rect = el.getBoundingClientRect();
      const OFFSET = 12;
      const HINT_W = 120;
      const HINT_H = 30;

      // 字段范围内
      let hintX = Math.max(rect.left + OFFSET, Math.min(e.clientX, rect.right - HINT_W));
      let hintY = e.clientY + OFFSET < rect.bottom - HINT_H ? e.clientY + OFFSET : rect.top - HINT_H;

      // 视口裁剪（确保浮标不超出屏幕）
      hintX = Math.max(4, Math.min(hintX, window.innerWidth - HINT_W - 4));
      hintY = Math.max(4, hintY);
      setHint({ x: hintX, y: hintY });

      if (leaveTimerRef.current !== null) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = null;
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el?.matches?.(FORM_SELECTORS)) return;

      // 延时隐藏（给用户移动到浮标的时间）
      leaveTimerRef.current = setTimeout(() => {
        setHint(null);
        currentFieldRef.current = null;
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
        currentFieldRef.current = null;
      }, 300);
    };

    const onClick = () => {
      const el = currentFieldRef.current;
      if (!el) return;
      const type = detectFormType(el);
      //const label = el.getAttribute("placeholder") ?? el.getAttribute("aria-label") ?? (el as HTMLInputElement).name ?? type;
      setHint(null);
      currentFieldRef.current = null;
      onOpen(type);
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("click", onClick);

    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("click", onClick);
    };
  }, [hint, onOpen]);

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
          {HINT_LABELS[formType]}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FormHint;
