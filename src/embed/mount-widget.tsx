import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import ChatWidget from "@/features/chat-widget/chat-widget";
import { PortalTargetProvider } from "./portal-context";

// 挂载状态追踪
let root: Root | null = null;

/**
 * 将 AI 助手 Widget 挂载到 Shadow DOM 容器中
 * @param mountPoint - Shadow DOM 内的挂载点
 * @param portalTarget - Portal 目标节点（用于 ConfirmToolUI 弹窗）
 */
export const mountWidget = (mountPoint: HTMLElement, portalTarget: HTMLElement) => {
  // 清理旧实例
  if (root) {
    root.unmount();
    root = null;
  }
  root = createRoot(mountPoint);
  root.render(
    <StrictMode>
      <PortalTargetProvider value={portalTarget}>
        <ChatWidget />
      </PortalTargetProvider>
    </StrictMode>
  );
};

/**
 * 卸载 Widget
 */
export const unmountWidget = () => {
  if (root) {
    root.unmount();
    root = null;
  }
};
