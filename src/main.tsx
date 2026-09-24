import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { enableShadowDOM } from "react-stately/private/flags/flags";
import App from "./App.tsx";
// 开发测试工具（仅 dev 模式挂载到 window）
import "./utils/dev-test-helper";

import { createDebugLogger } from "@/utils/debug-log";

// 过滤 AI SDK 内部 abort 时的未捕获异常，避免 DevTools 显示红色错误
window.addEventListener("unhandledrejection", (e) => {
  if (e.reason instanceof Error && (e.reason.name === "AbortError" || e.reason.name === "AI_NoOutputGeneratedError")) {
    e.preventDefault();
  }
});

const debugLog = createDebugLogger("[main]");
// 开发模式：初始化 Shadow DOM 容器，模拟 UMD 嵌入的 Shadow DOM 环境
if (import.meta.env.DEV) {
  const host = document.createElement("div");
  host.id = "shadow-dev-host";
  host.style.cssText = "position:fixed;z-index:2147483647;";
  document.body.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: "open" });

  const mountPoint = document.createElement("div");
  mountPoint.id = "shadow-mount";
  mountPoint.style.cssText = "position:fixed;bottom:0;right:0";
  shadowRoot.appendChild(mountPoint);

  // 创建 Portal 目标节点，与 UMD 生产模式对齐
  const portalTarget = document.createElement("div");
  portalTarget.id = "confirm-portal";
  portalTarget.style.cssText = "z-index:50;inset:0;";
  mountPoint.appendChild(portalTarget);

  // 启用 react-stately Shadow DOM 兼容模式
  enableShadowDOM();

  // 同步 <head> 中的 <style> 标签到 Shadow DOM
  const syncStyles = () => {
    shadowRoot.querySelectorAll("style[data-shadow-cloned]").forEach((el) => el.remove());
    document.querySelectorAll("style").forEach((style) => {
      const clone = style.cloneNode(true) as HTMLStyleElement;
      clone.setAttribute("data-shadow-cloned", "");
      shadowRoot.appendChild(clone);
    });
  };

  syncStyles();

  const observer = new MutationObserver(syncStyles);
  observer.observe(document.head, { childList: true, subtree: true });
}
debugLog.log("load");
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
