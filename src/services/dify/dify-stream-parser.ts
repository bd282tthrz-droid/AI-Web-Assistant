import { DifyStreamEventSchema } from '@/schemas/dify.schema'
import type { DifyStreamEvent } from '@/schemas/dify.schema'

// Dify SSE 流解析器
// 将 ReadableStream<Uint8Array> 转换为异步可迭代的 DifyStreamEvent

// 解析单行 SSE 数据为 Dify 事件对象
const parseSSELine = (line: string): DifyStreamEvent | null => {
  // SSE 格式：data: {json}
  if (!line.startsWith('data:')) return null

  const jsonStr = line.slice(5).trim()
  if (!jsonStr) return null

  try {
    const parsed: unknown = JSON.parse(jsonStr)
    // 使用 Zod Schema 校验并解析
    const result = DifyStreamEventSchema.safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    // JSON 解析失败，跳过异常数据块
    return null
  }
}

// 将 Response.body 的 Uint8Array 流转换为 DifyStreamEvent 异步迭代器
export const parseDifyStream = (
  body: ReadableStream<Uint8Array>,
): AsyncIterable<DifyStreamEvent> => {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  return {
    async *[Symbol.asyncIterator](): AsyncIterator<DifyStreamEvent> {
      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            // 处理缓冲区剩余数据
            if (buffer.trim()) {
              const event = parseSSELine(buffer)
              if (event) yield event
            }
            return
          }

          // 累加到缓冲区
          buffer += decoder.decode(value, { stream: true })

          // 按换行符分割处理完整行
          const lines = buffer.split('\n')
          // 最后一行可能不完整，保留到下次处理
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
