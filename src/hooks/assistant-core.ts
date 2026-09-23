import { buildContextInputs } from '@/features/page-context/context-builder'

// 构建页面上下文 inputs
export const buildSharedContextInputs = (): Record<string, string> => {
  return buildContextInputs()
}