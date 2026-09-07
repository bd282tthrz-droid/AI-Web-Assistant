// API Endpoint 集中管理
// 所有请求路径统一在此声明，禁止在业务代码中硬编码 URL

export const API_ENDPOINTS = {
  // Dify 对话消息接口（支持 SSE 流式响应）
  DIFY_CHAT_MESSAGES: "https://dify.app.hicloudapp.com/v1/chat-messages",

  // Dify 会话管理接口
  DIFY_CONVERSATIONS: "https://dify.app.hicloudapp.com/v1/conversations",

  // Dify 会话消息历史
  DIFY_MESSAGES: (conversationId: string) => `https://dify.app.hicloudapp.com/v1/messages?conversation_id=${conversationId}`,

  // Dify 删除会话
  DIFY_DELETE_CONVERSATION: (conversationId: string) => `https://dify.app.hicloudapp.com/v1/conversations/${conversationId}`,

  // 本地 Agent 接口（ai-sdk Data Stream 协议，支持流式 + tool 回传）
  LOCAL_AGENT_CHAT: "/local/api/ai/chat/demo"
} as const;

// Dify 连接配置
export const DIFY_CONFIG = {
  // API Key 通过环境变量注入，禁止硬编码
  API_KEY: import.meta.env.VITE_DIFY_API_KEY ?? "",
  // 应用 ID
  APP_ID: import.meta.env.VITE_DIFY_APP_ID ?? "",
  // 基础 URL
  BASE_URL: "https://dify.app.hicloudapp.com/v1"
} as const;
