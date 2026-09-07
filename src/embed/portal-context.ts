import { createContext, useContext } from "react";

// Portal 目标元素上下文
// 用于在 Shadow DOM 环境下将 ConfirmToolUI 弹窗渲染到 Shadow DOM 内的目标节点
// 非 Shadow DOM 环境（dev 模式）下保持向后兼容

const PortalTargetContext = createContext<HTMLElement | null>(null);

export const PortalTargetProvider = PortalTargetContext.Provider;
export const usePortalTarget = () => useContext(PortalTargetContext);