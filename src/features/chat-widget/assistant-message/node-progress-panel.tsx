import { memo, useEffect, useRef, type FC } from "react";
import { useAuiState } from "@assistant-ui/store";
import { ReasoningRoot, ReasoningTrigger, ReasoningContent, ReasoningText } from "@/components/assistant-ui/elements/reasoning.aui";
import { LoaderIcon, type LoaderIconHandle } from "@/components/ui/loader";
import { ICONS } from "@/constants/icon";
import { useNodeProgress } from "@/services/dify/node-progress-store";
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
  readonly keyIndex?: number;
}

const NodeProgressPanel: FC<NodeProgressPanelProps> = ({ messageId, keyIndex }) => {
  // 历史加载的消息（关闭助手后重新打开恢复的对话）不显示进度节点
  const isHistory = useAuiState((s) => s.message.metadata?.custom?.isHistory === true);
  if (isHistory) return null;

  const allGroups = useNodeProgress((s) => s.nodesByMessage);

  // 获取节点组（新数据结构：Record<string, NodeGroupState>）
  const id = keyIndex?.toString() ?? messageId;
  const nodeGroup = allGroups[id];
  const nodes = nodeGroup?.nodes ?? [];

  const isFinished = nodeGroup?.isFinished ?? false;
  debugLog.log("[NodeProgressPanel] render", { id, nodes, isFinished });
  if (!nodes || nodes.length === 0) return null;

  return (
    <ReasoningRoot active={!isFinished} variant="outline" className="mb-3">
      <ReasoningTrigger active={!isFinished} />
      <ReasoningContent>
        <ReasoningText>
          {nodes.map((n, i) => (
            <NodeItem key={i} title={n.title} done={n.done} />
          ))}
        </ReasoningText>
      </ReasoningContent>
    </ReasoningRoot>
  );
};

export default memo(NodeProgressPanel);
