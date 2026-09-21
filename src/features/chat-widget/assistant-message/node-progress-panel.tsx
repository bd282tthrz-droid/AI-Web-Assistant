import { useEffect, useRef, type FC } from "react";
import { ReasoningRoot, ReasoningTrigger, ReasoningContent, ReasoningText } from "@/components/assistant-ui/elements/reasoning.aui";
import { LoaderIcon, type LoaderIconHandle } from "@/components/ui/loader";
import { ICONS } from "@/constants/icon";
import { useNodeProgress } from "@/services/dify/node-progress-store";

// ── NodeItem（仅被本组件使用） ──

interface NodeItemProps {
  readonly title: string;
  readonly done: boolean;
}

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

const NodeProgressPanel: FC = () => {
  const { nodes, isActive: hasNodes } = useNodeProgress();
  if (nodes.length === 0) return null;

  return (
    <ReasoningRoot streaming={hasNodes} defaultOpen variant="outline" className="mb-3">
      <ReasoningTrigger active={hasNodes} />
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

export default NodeProgressPanel;
