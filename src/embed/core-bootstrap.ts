// 核心包入口 - 按需加载
// 由 fab-bootstrap 在用户点击 FAB 后动态加载
// 接管现有的 Shadow DOM 容器，挂载完整的 React 聊天界面

import { enableShadowDOM } from "react-stately/private/flags/flags";
import { mountWidget, unmountWidget } from "./mount-widget";
import "./embed.css";

const CONTAINER_ID = "web-assistant-shadow-host";
const MOUNT_ID = "web-assistant-mount";
const PORTAL_ID = "confirm-portal";

/**
 * 当 CSS 文件通过 <link> 加载到 Shadow DOM 中时，存在两个问题：
 *
 * 1. :root 选择器无法将 CSS 自定义属性作用于 Shadow DOM 内部元素
 *    → 提取 :root 规则，替换为 :host 选择器
 *
 * 2. @property 规则在 Shadow DOM <link> 样式表中不会注册自定义属性
 *    → 需要从 *,:before,:after,::backdrop 回退规则中提取变量定义
 */
const injectHostVariables = async (shadowRoot: ShadowRoot) => {
  // 找到 Shadow DOM 中的 <link> 样式表
  const linkEl = shadowRoot.querySelector("link[rel='stylesheet']") as HTMLLinkElement | null;
  if (!linkEl?.href) return;

  try {
    const response = await fetch(linkEl.href);
    const cssText = await response.text();

    const hostStyles: string[] = [];

    // 提取 :root 规则块 → 替换为 :host
    let searchStart = 0;
    while (searchStart < cssText.length) {
      const rootIdx = cssText.indexOf(":root", searchStart);
      if (rootIdx === -1) break;

      const openBrace = cssText.indexOf("{", rootIdx);
      if (openBrace === -1) break;

      let depth = 1;
      let closeBrace = openBrace + 1;
      while (depth > 0 && closeBrace < cssText.length) {
        if (cssText[closeBrace] === "{") depth++;
        else if (cssText[closeBrace] === "}") depth--;
        closeBrace++;
      }
      if (depth !== 0) break;

      const ruleBlock = cssText.slice(rootIdx, closeBrace);
      if (ruleBlock.includes("--")) {
        const modifiedBlock = ruleBlock.replace(/:root(,\s*\.\w[^{]*)?/g, ":host");
        hostStyles.push(modifiedBlock);
      }

      searchStart = closeBrace;
    }

    // 提取 *,:before,:after,::backdrop 规则块
    const universalRegex = /(?:^|}|;)\s*\*[,:{]/g;
    let universalMatch: RegExpExecArray | null;
    while ((universalMatch = universalRegex.exec(cssText)) !== null) {
      const starIdx = cssText.indexOf("*", universalMatch.index);
      if (starIdx === -1 || starIdx >= universalMatch.index + universalMatch[0].length) continue;

      const openBrace = cssText.indexOf("{", starIdx);
      if (openBrace === -1) continue;

      let depth = 1;
      let closeBrace = openBrace + 1;
      while (depth > 0 && closeBrace < cssText.length) {
        if (cssText[closeBrace] === "{") depth++;
        else if (cssText[closeBrace] === "}") depth--;
        closeBrace++;
      }
      if (depth !== 0) continue;

      const ruleBlock = cssText.slice(starIdx, closeBrace);
      if (ruleBlock.includes("--tw-")) {
        hostStyles.push(ruleBlock);
      }

      universalRegex.lastIndex = closeBrace;
    }

    if (hostStyles.length > 0) {
      const styleEl = document.createElement("style");
      styleEl.textContent = hostStyles.join("\n");
      shadowRoot.appendChild(styleEl);
    }
  } catch {
    // CSS 变量注入失败不影响功能，仅样式缺失
  }
};

const init = () => {
  // 查找已存在的 Shadow DOM 容器（由 fab-bootstrap 创建）
  const host = document.getElementById(CONTAINER_ID);
  if (!host?.shadowRoot) return;

  const shadowRoot = host.shadowRoot;
  const mountPoint = shadowRoot.getElementById(MOUNT_ID);
  const portalTarget = shadowRoot.getElementById(PORTAL_ID);
  // 模板容器是 mountPoint 的第一个 div 子元素（portalTarget 之后）
  const template = mountPoint?.querySelector("div:not([id])") as HTMLElement | null;
  if (!mountPoint || !portalTarget || !template) return;

  // 移除 FAB 加载动画（由 fab-bootstrap 替换 FAB 按钮时创建）
  const loader = shadowRoot.querySelector(".fab-loading");
  if (loader) loader.remove();

  // 启用 react-stately Shadow DOM 兼容模式
  (globalThis as Record<string, unknown>).__web_assistant_shadow = (enableShadowDOM(), true);

  // 注入 CSS 变量到 Shadow DOM
  injectHostVariables(shadowRoot);

  // 确认 mountPoint 可见
  mountPoint.style.display = "";

  // 挂载 React Widget（渲染到 template，保留 portalTarget 兄弟节点）
  mountWidget(template, portalTarget);
};

// 等待 DOM 就绪后初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}

// 导出用于手动控制
export { mountWidget, unmountWidget };