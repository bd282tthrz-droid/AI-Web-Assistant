import { useEffect, useRef, type FC } from "react";
import { ReasoningRoot, ReasoningTrigger, ReasoningContent, ReasoningText } from "@/components/assistant-ui/elements/reasoning.aui";
import { LoaderIcon, type LoaderIconHandle } from "@/components/ui/loader";
import { ICONS } from "@/constants/icon";
import { useNodeProgress } from "@/services/dify/node-progress-store";
import { useMessageNodeStore } from "@/services/dify/message-node-store";
import { createDebugLogger } from "@/utils/debug-log";

// ── NodeItem（仅被本组件使用） ──

interface NodeItemProps {
  readonly title: string;
  readonly done: boolean;
}
const debugLog = createDebugLogger("[node-progress-panel]");

const NodeItem: FC<NodeItemProps> = ({ title, done }) => {
  const loaderRef = useRef<LoaderIconHandle>(null);

  useEffect(() => {
    if (!done) loaderRef.current?.startAnimation();
  }, [done]);

  return (
    <div className="flex items-center gap-2 text-sm text-[#325f419f]">
      <span className="shrink-0">{done ? <ICONS.check className="shrink-0 text-[#325f419f]" size={14} /> : <LoaderIcon ref={loaderRef} size={16} />}</span>
      <span>{title}</span>
    </div>
  );
};

// ── NodeProgressPanel ──

interface NodeProgressPanelProps {
  readonly messageId: string;
}

const NodeProgressPanel: FC<NodeProgressPanelProps> = ({ messageId }) => {
  // 优先读 per-message 持久化 store（已完成的消息）
  const persistedNodes = useMessageNodeStore((s) => s.nodesByMessage[messageId]);
  // 兜底读实时 streaming store（正在流式的消息）
  const streamingNodes = useNodeProgress((s) => s.nodes);
  const streamingActive = useNodeProgress((s) => s.isActive);

  // debugLog.log("messageId", messageId, "persistedNodes", persistedNodes, "streamingActive", streamingActive, "streamingNodes", streamingNodes);

  // 有持久化数据（即使是空数组）→ 该消息已完成，渲染持久化的
  if (persistedNodes !== undefined) {
    if (persistedNodes.length === 0) return null;
    return (
      <ReasoningRoot streaming={false} defaultOpen variant="outline" className="mb-3">
        <ReasoningTrigger active={false} />
        <ReasoningContent>
          <ReasoningText>
            {persistedNodes.map((n, i) => (
              <NodeItem key={i} title={n.title} done={n.done} />
            ))}
          </ReasoningText>
        </ReasoningContent>
      </ReasoningRoot>
    );
  }

  // 无持久化数据、且当前正在流式 → 渲染实时进度
  if (streamingActive && streamingNodes.length > 0) {
    return (
      <ReasoningRoot streaming={true} defaultOpen variant="outline" className="mb-3">
        <ReasoningTrigger active={true} />
        <ReasoningContent>
          <ReasoningText>
            {streamingNodes.map((n, i) => (
              <NodeItem key={i} title={n.title} done={n.done} />
            ))}
          </ReasoningText>
        </ReasoningContent>
      </ReasoningRoot>
    );
  }

  return null;
};

export default NodeProgressPanel;
