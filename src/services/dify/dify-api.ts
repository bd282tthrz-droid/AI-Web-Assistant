// Dify API 业务方法
// 纯数据请求层，不涉及 UI/streaming 逻辑

import { createApiClient } from "@/services/api/client";
import { DIFY_CONFIG } from "@/constants/api";
import { getSessionId } from "./dify-conversation";

// ── 类型 ──

interface DifyMessageItem {
  readonly id: string;
  readonly query: string;
  readonly answer: string;
  readonly created_at: number;
  readonly conversation_id: string;
}

interface MessagesResponse {
  readonly data?: readonly DifyMessageItem[];
  readonly has_more?: boolean;
}

// ── 客户端创建（延迟初始化，避免模块加载时序问题） ──

let _difyClient: ReturnType<ReturnType<typeof createApiClient>["extend"]> | null = null;

const getClient = () => {
  if (!_difyClient) {
    _difyClient = createApiClient({
      prefix: DIFY_CONFIG.BASE_URL,
      apiKey: DIFY_CONFIG.API_KEY,
      name: "Dify API",
    }).extend({
      searchParams: { user: getSessionId() },
    });
  }
  return _difyClient;
};

// ── 类型 ──

interface DifyMessageItem {
  readonly id: string;
  readonly query: string;
  readonly answer: string;
  readonly created_at: number;
  readonly conversation_id: string;
}

interface MessagesResponse {
  readonly data?: readonly DifyMessageItem[];
  readonly has_more?: boolean;
}

// ── 业务 API ──

/**
 * 获取会话历史消息（最新在前）
 * @param conversationId - 会话 ID
 * @param limit - 条数上限（默认 20）
 * @param offset - 偏移量（默认 0）
 */
export const fetchConversationMessages = (
  conversationId: string,
  limit = 20,
  offset = 0,
) =>
  getClient()
    .get("messages", {
      searchParams: {
        conversation_id: conversationId,
        limit: String(limit),
        offset: String(offset),
      },
    })
    .json<MessagesResponse>();