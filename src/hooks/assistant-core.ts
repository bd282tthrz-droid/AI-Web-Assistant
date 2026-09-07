import type { ChatModelRunOptions } from '@assistant-ui/react'
import { buildContextInputs } from '@/features/page-context/context-builder'

// 助手共享逻辑
// Dify 模式与 Local 模式通用的工具函数
// Action 执行结果已由 assistant-ui 工具机制（toolkit execute + tool-call result）管理

// 从 ThreadMessage 数组中提取最新用户消息文本
export const extractLastUserMessage = (
  messages: ChatModelRunOptions['messages'],
): string => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role !== 'user') continue

    const textParts = msg.content
      .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map((part) => part.text)
    return textParts.join('') || ''
  }
  return ''
}

// 构建页面上下文 inputs（两种模式通用）
export const buildSharedContextInputs = (): Record<string, string> => {
  return buildContextInputs()
}
