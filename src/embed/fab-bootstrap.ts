// FAB 按钮轻量入口
// 页面加载时仅渲染 FAB 按钮（纯 DOM API，无 React 依赖）
// 用户点击 FAB 后，动态加载核心包（React + 聊天界面）
//
// 核心包 CSS/JS 文件与脚本同目录，通过 scriptSrc 推导 URL

const CONTAINER_ID = "web-assistant-shadow-host";
const MOUNT_ID = "web-assistant-mount";
const PORTAL_ID = "confirm-portal";
const CORE_LOADED_FLAG = "__web_assistant_core_loaded";

// 在模块顶层捕获脚本 URL（同步 <script> 执行时 document.currentScript 可靠）
const scriptSrc = (document.currentScript as HTMLScriptElement | null)?.src ?? "";
const baseUrl = scriptSrc ? scriptSrc.replace(/\/[^/]+\.js$/, "/") : "";

// FAB 按钮样式
const FAB_STYLES = `
  #${CONTAINER_ID} {
    all: initial;
  }
  #${CONTAINER_ID} * {
    box-sizing: border-box;
  }
  .fab-button {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    background: #FF641E;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(255, 100, 30, 0.3);
    transition: transform 0.2s ease, opacity 0.2s ease;
    font-size: 24px;
    line-height: 1;
  }
  .fab-button:hover {
    transform: scale(1.05);
  }
  .fab-button:active {
    transform: scale(0.95);
  }
  .fab-loading {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .fab-spinner {
    width: 24px;
    height: 24px;
    border: 3px solid rgba(255, 100, 30, 0.2);
    border-top-color: #FF641E;
    border-radius: 50%;
    animation: fab-spin 0.8s linear infinite;
  }
  @keyframes fab-spin {
    to { transform: rotate(360deg); }
  }
`;

// SVG 图标（消息气泡 + Sparkle）
const ASSISTANT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M18 3 L18.5 6.5 L22 7 L18.5 7.5 L18 11 L17.5 7.5 L14 7 L17.5 6.5 Z"/></svg>`;

const init = () => {
  if (document.getElementById(CONTAINER_ID)) return;

  // 1. 创建 Shadow DOM 容器
  const host = document.createElement("div");
  host.id = CONTAINER_ID;
  document.body.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: "open" });

  // 2. 注入 FAB 样式
  const styleEl = document.createElement("style");
  styleEl.textContent = FAB_STYLES;
  shadowRoot.appendChild(styleEl);

  // 3. 创建 Portal 目标节点（ConfirmToolUI 弹窗渲染目标，暂不加入 DOM）
  const portalTarget = document.createElement("div");
  portalTarget.id = PORTAL_ID;
  portalTarget.style.cssText = "position:absolute;z-index:50;";

  // 4. 创建 React 挂载点（隐藏，核心包加载后使用）
  const mountPoint = document.createElement("div");
  mountPoint.id = MOUNT_ID;
  mountPoint.style.cssText = "position:fixed;bottom:96px;right:10px;z-index:9999999;display:none;";

  // 5. 创建模板容器（mountWidget 渲染到此容器，不影响 portalTarget 兄弟节点）
  const template = document.createElement("div");

  // 5. 渲染 FAB 按钮
  const fabButton = document.createElement("button");
  fabButton.className = "fab-button";
  fabButton.innerHTML = ASSISTANT_ICON;
  fabButton.setAttribute("aria-label", "Open AI Assistant");
  shadowRoot.appendChild(fabButton);

  // 6. 绑定点击事件 → 动态加载核心包
  const loadCore = () => {
    if ((globalThis as Record<string, unknown>)[CORE_LOADED_FLAG]) return;
    (globalThis as Record<string, unknown>)[CORE_LOADED_FLAG] = true;

    // 替换 FAB 为加载中动画
    const loader = document.createElement("div");
    loader.className = "fab-loading";
    loader.innerHTML = '<div class="fab-spinner"></div>';
    shadowRoot.replaceChild(loader, fabButton);

    // 加载核心 CSS
    const cssUrl = baseUrl + "web-assistant-core.umd.css";
    const linkEl = document.createElement("link");
    linkEl.rel = "stylesheet";
    linkEl.href = cssUrl;
    shadowRoot.appendChild(linkEl);

    // 加载核心 JS
    const jsUrl = baseUrl + "web-assistant-core.umd.js";
    const scriptEl = document.createElement("script");
    scriptEl.src = jsUrl;
    scriptEl.onload = () => {
      // 核心脚本挂载后，显示 mountPoint
      mountPoint.style.display = "";
      // 通知核心脚本：Shadow DOM 容器已就绪
      const event = new CustomEvent("web-assistant-core-ready", {
        detail: {
          shadowRoot,
          mountPoint,
          portalTarget,
          host
        }
      });
      document.dispatchEvent(event);
    };
    document.body.appendChild(scriptEl);
  };

  fabButton.addEventListener("click", loadCore);

  // ── 鼠标跟随浮标 ──
  const hintEl = document.createElement("div");
  hintEl.textContent = "❓ Ask AI";
  hintEl.style.cssText =
    "position:fixed;z-index:2147483646;pointer-events:auto;" +
    "opacity:0;font-size:13px;color:#FF641E;" +
    "background:rgba(255,255,255,0.85);padding:2px 8px;border-radius:4px;" +
    "white-space:nowrap;transition:opacity 0.2s;user-select:none;" +
    "cursor:pointer;";
  shadowRoot.appendChild(hintEl);

  let mouseTimer: number | null = null;
  let lastX = -100,
    lastY = -100;
  let isOverHint = false;

  // 鼠标进入浮标 → 不隐藏
  hintEl.addEventListener("mouseenter", () => {
    isOverHint = true;
    if (mouseTimer !== null) clearTimeout(mouseTimer);
  });

  // 鼠标离开浮标 → 800ms 后隐藏
  hintEl.addEventListener("mouseleave", () => {
    isOverHint = false;
    if (mouseTimer !== null) clearTimeout(mouseTimer);
    if (hintEl.style.opacity === "0") return;
    mouseTimer = window.setTimeout(() => {
      hintEl.style.opacity = "0";
    }, 800);
  });

  document.addEventListener("mousemove", (e) => {
    lastX = e.clientX;
    lastY = e.clientY;
    if (mouseTimer !== null) clearTimeout(mouseTimer);
    // 忽略浮标之外的其他 Shadow DOM 子元素事件
    if (!isOverHint && e.target !== hintEl && !hintEl.contains(e.target as Node) && shadowRoot.contains(e.target as Node)) return;

    // 鼠标在浮标上 → 不触发任何计时
    if (isOverHint) return;

    if (hintEl.style.opacity === "0") {
      // 浮标隐藏 → 1s 无移动 → 显示
      mouseTimer = window.setTimeout(() => {
        if ((globalThis as Record<string, unknown>)[CORE_LOADED_FLAG]) return;
        hintEl.style.left = `${lastX + 15}px`;
        hintEl.style.top = `${lastY + 15}px`;
        hintEl.style.opacity = "0.7";
      }, 1000);
    } else {
      // 浮标显示 → 800ms 无移动 → 隐藏
      mouseTimer = window.setTimeout(() => {
        hintEl.style.opacity = "0";
      }, 800);
    }
  });

  hintEl.addEventListener("click", (e) => {
    e.stopPropagation();
    if (mouseTimer !== null) clearTimeout(mouseTimer);
    hintEl.style.opacity = "0";
    loadCore();
  });

  // 7. 将 mountPoint、portalTarget、template 加入 DOM（但 mountPoint 隐藏）
  mountPoint.appendChild(portalTarget);
  mountPoint.appendChild(template);
  shadowRoot.appendChild(mountPoint);
};

// 自动初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
