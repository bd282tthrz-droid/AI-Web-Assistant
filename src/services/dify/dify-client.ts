import { API_ENDPOINTS } from '@/constants/api'
import { DIFY_CONFIG, validateDifyConfig } from './dify-config'
import { DifyChatRequestSchema } from '@/schemas/dify.schema'
import type { DifyChatRequest, DifyStreamEvent } from '@/schemas/dify.schema'
import { parseDifyStream } from './dify-stream-parser'

// Dify API 客户端
// 封装 chat-messages 接口的流式请求

// 发送消息参数（内部类型，非外部数据）
interface SendMessageParams {
  readonly query: string
  readonly inputs?: Record<string, string>
  readonly conversationId?: string
  readonly user: string
}

// 构建 Dify chat-messages 请求
const buildRequestBody = (params: SendMessageParams): DifyChatRequest => {
  const body = {
    query: params.query,
    inputs: params.inputs ?? {},
    response_mode: 'streaming' as const,
    user: params.user,
    conversation_id: params.conversationId,
  }

  // 使用 Zod 校验请求体
  const result = DifyChatRequestSchema.safeParse(body)
  if (!result.success) {
    throw new Error(`Dify request validation failed: ${result.error.message}`)
  }
  return result.data
}

// 发送消息并返回 SSE 流事件异步迭代器
export const sendChatMessage = async (
  params: SendMessageParams,
): Promise<AsyncIterable<DifyStreamEvent>> => {
  validateDifyConfig()

  const requestBody = buildRequestBody(params)

  const response = await fetch(API_ENDPOINTS.DIFY_CHAT_MESSAGES, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DIFY_CONFIG.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Dify API request failed (${response.status}): ${errorText}`)
  }

  if (!response.body) {
    throw new Error('Dify API returned empty response body')
  }

  return parseDifyStream(response.body)
}
