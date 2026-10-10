// 消息反馈 Hook
// 管理点赞/点踩的本地状态，通过 TanStack Query 同步 Dify feedback API
// 初始值和实时更新均依赖 zustand store 的响应式订阅

import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { submitFeedback } from "@/services/dify/dify-api";
import { useDifyMessageStore } from "@/services/dify/dify-message-store";
import type { Reaction } from "@/components/elements/message-actions";
import { createDebugLogger } from "@/utils/debug-log";

const debugLog = createDebugLogger("[feedback]");

export const useMessageFeedback = (messageId: string) => {
  const storeReaction = useDifyMessageStore((s) => s.reactions[messageId]);
  const [reaction, setReaction] = useState<Reaction>(null);
  const prevRef = useRef<Reaction>(null);

  // store 更新时同步到本地 state（历史加载、API 成功回写等场景）
  useEffect(() => {
    if (storeReaction !== undefined) {
      debugLog.log("store sync:", messageId, storeReaction);
      setReaction(storeReaction);
    }
  }, [storeReaction, messageId]);

  const { mutate } = useMutation({
    mutationFn: ({ difyMsgId, rating }: { difyMsgId: string; rating: "like" | "dislike" }) =>
      submitFeedback(difyMsgId, rating),
    onSuccess: (_data, variables) => {
      // 成功后同步 store → 触发 storeReaction 变更 → useEffect → UI 更新
      useDifyMessageStore.getState().setReaction(
        messageId,
        variables.rating === "like" ? "up" : "down",
      );
    },
    onError: () => {
      // 失败时回滚到之前的状态
      setReaction(prevRef.current);
    },
  });

  const handleReaction = useCallback(
    (newReaction: Reaction) => {
      if (newReaction === reaction) return;
      prevRef.current = reaction;
      setReaction(newReaction);
      if (!newReaction) return;

      const difyMessageId = useDifyMessageStore.getState().difyIds[messageId];
      if (!difyMessageId) return;

      mutate({ difyMsgId: difyMessageId, rating: newReaction === "up" ? "like" : "dislike" });
    },
    [messageId, reaction, mutate],
  );

  return { reaction, handleReaction } as const;
};