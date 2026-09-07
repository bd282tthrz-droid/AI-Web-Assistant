import { parseActionsFromMessage, stripActionBlocks, hasActionBlock } from '@/features/action-executor/action-parser'
import { executeAction } from '@/features/action-executor/action-executor'
import type { ActionCall } from '@/features/action-executor/action-types'

// 开发测试辅助工具
// 暴露到 window 上用于浏览器手动测试 action 解析与执行
// 生产构建时会被 tree-shaking 移除（仅在 import.meta.env.DEV 时挂载）

interface TestActionResult {
  readonly actionCall: ActionCall | null
  readonly execResult: unknown
}

// 测试解析 + 执行单个指令
export const testAction = async (mockReply: string): Promise<TestActionResult> => {
  const actions = parseActionsFromMessage(mockReply)
  if (actions.length === 0) {
    return { actionCall: null, execResult: { success: false, message: 'No instruction parsed' } }
  }

  const result = await executeAction(actions[0])
  return { actionCall: actions[0], execResult: result }
}

// 暴露到 window 供浏览器控制台测试
if (import.meta.env.DEV) {
  Object.assign(window, {
    __assistantTest: {
      testAction,
      parseActionsFromMessage,
      stripActionBlocks,
      hasActionBlock,
      executeAction,
    },
  })
}
