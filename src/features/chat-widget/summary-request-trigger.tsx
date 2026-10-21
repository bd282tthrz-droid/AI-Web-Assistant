// 页面总结请求发送器
// 驻留在 Thread 内，订阅 SummaryStore.seq 变化，seq > 0 时向 Dify 自动发送页面总结请求
// 请求消息携带 metadata.custom.type 标记，供 transport 识别并在回复上注入 pageSummary 标记

import { useAui } from "@assistant-ui/store";
import { useEffect, useRef, type FC } from "react";
import { MESSAGE_TYPE_PAGE_SUMMARY, SUMMARY_PROMPT } from "@/constants/page-summary";
import { useSummaryStore } from "./page-summary-store";

const SummaryRequestTrigger: FC = () => {
  const aui = useAui();
  const seq = useSummaryStore((s) => s.seq);
  // 记录已消费的 seq：仅在 seq 发生变化时发送，避免组件重新挂载（关闭重开）时用残留 seq 重发
  const lastSeqRef = useRef(seq);

  useEffect(() => {
    if (seq === lastSeqRef.current) return;
    lastSeqRef.current = seq;
    aui.thread.append({
      content: [{ type: "text", text: SUMMARY_PROMPT }],
      metadata: { custom: { type: MESSAGE_TYPE_PAGE_SUMMARY } },
    });
  }, [aui, seq]);

  return null;
};

export default SummaryRequestTrigger;