import { unstable_useThreadMessageIds } from "@assistant-ui/react";

// 获取当前 thread 的消息 id 数组
// 封装 unstable_useThreadMessageIds，配合 ThreadPrimitive.Unstable_MessageById 实现虚拟列表
// 返回的数组在 id 序列不变时保持引用稳定（流式内容更新不会触发重渲染）
export const useThreadMessageIds = (): readonly string[] => {
  return unstable_useThreadMessageIds();
};
