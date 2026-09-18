// 宿主网站注入脚本入口
// 作为 UMD 加载时自动执行：创建 Shadow DOM 容器 → 注入 CSS → 挂载 Widget
// 使用 Shadow DOM 实现完整的样式隔离，不影响宿主网站的样式
//
// CSS 由 Vite 在 library 模式下自动提取为独立 web-assistant.umd.css 文件
// 运行时通过 <link> 动态加载到 Shadow DOM 中，JS 和 CSS 完全分离

import { enableShadowDOM } from "react-stately/private/flags/flags";
import { mountWidget, unmountWidget } from "./mount-widget";

// 导入 TailwindCSS utility 和项目自定义样式
// HeroUI 组件样式在 embed.css 中通过 CSS @import 导入，由 @tailwindcss/vite 插件处理
// Vite 在 library 模式下将所有 CSS 提取为独立的 web-assistant.umd.css 文件
// embed 脚本运行时通过 <link> 加载到 Shadow DOM 中
import "./embed.css";

const CONTAINER_ID = "web-assistant-shadow-host";
const MOUNT_ID = "web-assistant-mount";
const PORTAL_ID = "confirm-portal";

// 在模块顶层捕获脚本 URL（同步 <script> 执行时 document.currentScript 可靠）
// 用于推导同目录下的 CSS 文件路径
const scriptSrc = (document.currentScript as HTMLScriptElement | null)?.src ?? "";

/**
 * 当 CSS 文件通过 <link> 加载到 Shadow DOM 中时，存在两个问题：
 *
 * 1. :root 选择器无法将 CSS 自定义属性作用于 Shadow DOM 内部元素
 *    → 提取 :root 规则，替换为 :host 选择器
 *
 * 2. @property 规则在 Shadow DOM <link> 样式表中不会注册自定义属性
 *    → 需要从 *,:before,:after,::backdrop 回退规则中提取变量定义
 *
 * 此外，TailwindCSS v4 将 *,:before,:after,::backdrop 回退规则包裹在
 * @supports 条件中（检测旧浏览器前缀），现代浏览器不满足该条件，
 * 导致 --tw-border-style 等 95 个 TailwindCSS 内部变量完全缺失。
 */
const injectHostVariables = async (shadowRoot: ShadowRoot, cssUrl: string) => {
  try {
    const response = await fetch(cssUrl);
    const cssText = await response.text();

    const baseLayerStyles: string[] = [];
    const propertiesLayerStyles: string[] = [];

    // ── 1. 提取 :root 规则块 → 替换为 :host，包裹在 @layer base 中 ──
    // 手动扫描 CSS 文本，找到所有 :root 规则块
    // 将 :root 替换为 :host，使变量在 Shadow DOM 中可用
    // 注入到 @layer base 中，保持与 <link> 样式表一致的层叠优先级（无层 vs 有层的问题）
    let searchStart = 0;
    while (searchStart < cssText.length) {
      const rootIdx = cssText.indexOf(":root", searchStart);
      if (rootIdx === -1) break;

      const openBrace = cssText.indexOf("{", rootIdx);
      if (openBrace === -1) break;

      // 找到匹配的 }（支持嵌套大括号）
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
        baseLayerStyles.push(modifiedBlock);
      }

      searchStart = closeBrace;
    }

    // ── 2. 提取 *,::before,::after,::backdrop 规则块，包裹在 @layer properties 中 ──
    // TailwindCSS v4 将 --tw-* 内部变量定义在此选择器中，作为 @property 的回退
    // 但它被包裹在 @supports 条件内，现代浏览器不满足
    // 提取后直接注入到 Shadow DOM，不依赖 @supports 条件，
    // 并将选择器从 * 改为 :host，避免在 Shadow DOM 每个元素上重复声明变量
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
        const modifiedBlock = ruleBlock.replace(/^[^{]+{/, ":host{");
        propertiesLayerStyles.push(modifiedBlock);
      }

      universalRegex.lastIndex = closeBrace;
    }

    if (baseLayerStyles.length > 0 || propertiesLayerStyles.length > 0) {
      const styleEl = document.createElement("style");
      const parts: string[] = [];
      if (baseLayerStyles.length > 0) {
        parts.push(`@layer base{${baseLayerStyles.join("\n")}}`);
      }
      if (propertiesLayerStyles.length > 0) {
        parts.push(`@layer properties{${propertiesLayerStyles.join("\n")}}`);
      }
      styleEl.textContent = parts.join("\n");
      shadowRoot.appendChild(styleEl);
    }
  } catch {
    // CSS 变量注入失败不影响功能，仅样式缺失
  }
};

const init = () => {
  // 避免重复初始化
  if (document.getElementById(CONTAINER_ID)) return;

  // 1. 创建 Shadow DOM 容器
  const host = document.createElement("div");
  host.id = CONTAINER_ID;
  document.body.appendChild(host);

  // 2. 附加 Shadow DOM（open 模式用于调试，后期改为 closed）
  const shadowRoot = host.attachShadow({ mode: "open" });

  // 启用 react-stately Shadow DOM 兼容模式，使 react-aria 使用 composedPath() 获取正确事件目标
  // 注意：react-stately 的 package.json 中 sideEffects: false，导致 enableShadowDOM() 调用被 Rollup 错误 tree-shaking
  // 通过逗号表达式 + 全局属性赋值，使 Rollup 无法静态分析该调用的副作用
  (globalThis as Record<string, unknown>).__web_assistant_shadow = (enableShadowDOM(), true);

  // 3. 注入 CSS 到 Shadow DOM 中（通过 <link> 加载独立 CSS 文件）
  //    TailwindCSS utility 类、HeroUI 组件样式、m3-ripple、tw-shimmer 全部隔离在此
  const cssUrl = scriptSrc ? scriptSrc.replace(/\.js$/, ".css") : "web-assistant.css";
  const linkEl = document.createElement("link");
  linkEl.rel = "stylesheet";
  linkEl.href = cssUrl;
  shadowRoot.appendChild(linkEl);

  // 3b. CSS 加载完成后，提取 :root 变量并注入为 :host 样式
  // 解决 Shadow DOM 中 :root 选择器无法将 CSS 变量作用于内部元素的问题
  linkEl.addEventListener("load", () => {
    injectHostVariables(shadowRoot, cssUrl);
  });

  // 4. 创建 Portal 目标节点（ConfirmToolUI 弹窗渲染目标）
  const portalTarget = document.createElement("div");
  portalTarget.id = PORTAL_ID;
  portalTarget.style.cssText = "inset:0;z-index:50;";
  //shadowRoot.appendChild(portalTarget);

  // 5. 创建 React 挂载点
  // Shadow DOM 已提供样式隔离，无需 all:initial（避免影响 CSS 自定义属性继承）
  const mountPoint = document.createElement("div");
  mountPoint.id = MOUNT_ID;
  mountPoint.style.cssText = "position:fixed;bottom:96px;right:10px;z-index:9999999;";

  const template = document.createElement("div");
  mountPoint.appendChild(portalTarget);
  mountPoint.appendChild(template);
  shadowRoot.appendChild(mountPoint);
  //mountPoint.appendChild(portalTarget);

  // 6. 挂载 Widget
  mountWidget(template, portalTarget);
};

// 自动初始化：确保 DOM 已加载
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}

// 导出用于手动控制（UMD 全局变量可访问）
export { mountWidget, unmountWidget };
