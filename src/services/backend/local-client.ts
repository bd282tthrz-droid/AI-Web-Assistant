import { API_ENDPOINTS } from '@/constants/api'
import { DataStreamEventSchema } from '@/schemas/data-stream.schema'
import type { DataStreamEvent, ToolInputAvailable } from '@/schemas/data-stream.schema'

// 本地 Agent 接口客户端
// 对接已有后端的 ai-sdk Data Stream 协议
// 支持 tool-input-available 拦截与 tool result 回传

// 请求参数（内部类型，非外部数据）
interface LocalChatParams {
  /** 用户消息 */
  readonly query: string
  /** 页面上下文 inputs（类似 Dify inputs） */
  readonly inputs: Record<string, string>
  /** tool 回传时携带的 toolCallId */
  readonly toolCallId?: string
  /** tool 回传时携带的执行结果 */
  readonly toolOutput?: unknown
}

// 解析单行 SSE data 为 DataStreamEvent
const parseSSELine = (line: string): DataStreamEvent | null => {
  if (!line.startsWith('data:')) return null

  const jsonStr = line.slice(5).trim()
  if (!jsonStr) return null

  // 流结束标记
  if (jsonStr === '[DONE]') return null

  try {
    const parsed: unknown = JSON.parse(jsonStr)
    const result = DataStreamEventSchema.safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

// 将 ReadableStream 转换为 DataStreamEvent 异步迭代器
const parseDataStream = (body: ReadableStream<Uint8Array>): AsyncIterable<DataStreamEvent> => {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  return {
    async *[Symbol.asyncIterator](): AsyncIterator<DataStreamEvent> {
      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            if (buffer.trim()) {
              const event = parseSSELine(buffer)
              if (event) yield event
            }
            return
          }

          buffer += decoder.decode(value, { stream: true })

          // 按换行符分割处理完整行
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue

            const event = parseSSELine(trimmed)
            if (event) yield event
          }
        }
      } finally {
        reader.releaseLock()
      }
    },
  }
}

// 发送消息到本地 Agent 接口，返回 Data Stream 事件流
export const sendLocalMessage = async (
  params: LocalChatParams,
): Promise<AsyncIterable<DataStreamEvent>> => {
  // 构建请求体（类似 Dify 的 { query, inputs } 格式）
  const requestBody = {
    query: params.query,
    inputs: params.inputs,
    // tool 回传时附加 toolCallId + toolOutput
    ...(params.toolCallId ? { toolCallId: params.toolCallId } : {}),
    ...(params.toolOutput !== undefined ? { toolOutput: params.toolOutput } : {}),
  }

  const response = await fetch(API_ENDPOINTS.LOCAL_AGENT_CHAT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Local backend request failed (${response.status}): ${errorText}`)
  }

  if (!response.body) {
    throw new Error('Local backend returned empty response body')
  }

  return parseDataStream(response.body)
}

// 回传 tool 执行结果到后端，继续获取后续流
// 保守方案：用同一个流接口发起新一轮请求，携带 toolCallId + toolOutput
export const sendToolResult = async (
  toolCallId: string,
  output: unknown,
  inputs: Record<string, string>,
): Promise<AsyncIterable<DataStreamEvent>> => {
  return sendLocalMessage({
    query: '', // tool 回传不需要新 query
    inputs,
    toolCallId,
    toolOutput: output,
  })
}

// 提取 tool-input-available 事件（类型守卫辅助）
export const isToolInputAvailable = (event: DataStreamEvent): event is ToolInputAvailable => {
  return event.type === 'tool-input-available'
}
