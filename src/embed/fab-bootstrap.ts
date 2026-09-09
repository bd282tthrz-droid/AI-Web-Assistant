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

// SVG 图标（魔法棒）
const WAND_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14.5 6.5-11 11"/><path d="m14.5 6.5 3-3"/><path d="m17.5 3.5 3 3"/><path d="M9.5 14.5 3 21"/><path d="M17.5 14.5 21 11"/><path d="M14.5 17.5 11 21"/></svg>`;

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
  fabButton.innerHTML = WAND_ICON;
  fabButton.setAttribute("aria-label", "Open AI Assistant");
  shadowRoot.appendChild(fabButton);

  // 6. 绑定点击事件 → 动态加载核心包
  fabButton.addEventListener("click", () => {
    // 防止重复加载
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
