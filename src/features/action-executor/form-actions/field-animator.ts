// 字段填充动画 - 高亮闪烁 + 对勾确认
// 在 batch_fill 中逐字段触发

const HIGHLIGHT_CLASS = "__ai_assist_fill_highlight";
const DONE_CLASS = "__ai_assist_fill_done";
const DURATION_MS = 400;

// 注入 CSS（仅在首次调用时执行一次）
let cssInjected = false;
const injectStyles = () => {
  if (cssInjected) return;
  const style = document.createElement("style");
  style.textContent = `
    @keyframes __ai_assist_fill_pulse {
      0%   { background-color: transparent; outline-color: transparent; }
      30%  { background-color: #FFF3CD; outline-color: #FF641E; }
      60%  { background-color: #D4EDDA; outline-color: #28A745; }
      100% { background-color: transparent; outline-color: transparent; }
    }
    .${HIGHLIGHT_CLASS} {
      animation: __ai_assist_fill_pulse ${DURATION_MS}ms ease-in-out;
      outline: 2px solid #FF641E;
      outline-offset: 2px;
      border-radius: 4px;
    }
    .${DONE_CLASS} {
      outline: 2px solid #28A745;
      outline-offset: 2px;
      border-radius: 4px;
      transition: outline-color 0.3s ease;
    }
  `;
  document.head.appendChild(style);
  cssInjected = true;
};

// 给字段添加填充高亮动画
export const animateFill = (element: HTMLElement): Promise<void> => {
  injectStyles();

  return new Promise((resolve) => {
    element.classList.add(HIGHLIGHT_CLASS);

    // 滚动到元素位置
    element.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => {
      element.classList.remove(HIGHLIGHT_CLASS);

      // 显示完成标记（绿色边框短暂停留）
      element.classList.add(DONE_CLASS);
      setTimeout(() => {
        element.classList.remove(DONE_CLASS);
        resolve();
      }, 300);
    }, DURATION_MS);
  });
};