import type { ActionResult, ActionParams } from '../action-types'

// 高亮元素 Action
// 用于引导用户关注页面特定区域

// 高亮样式类名
const HIGHLIGHT_CLASS = 'ai-assistant-highlight'

// 创建高亮样式
const ensureHighlightStyle = (): void => {
  if (document.getElementById('ai-assistant-highlight-style')) return

  const style = document.createElement('style')
  style.id = 'ai-assistant-highlight-style'
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      outline: 3px solid #3b82f6 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.3) !important;
      transition: outline 0.3s, box-shadow 0.3s !important;
    }
  `
  document.head.appendChild(style)
}

// 清除所有高亮
const clearAllHighlights = (): void => {
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
    el.classList.remove(HIGHLIGHT_CLASS)
  })
}

export const executeHighlight = async (params: ActionParams): Promise<ActionResult> => {
  const { element } = params

  if (!element) {
    return {
      success: false,
      error: 'element_not_found',
      message: 'Target element not found',
    }
  }

  try {
    ensureHighlightStyle()

    // 清除之前的高亮
    clearAllHighlights()

    // 滚动到元素
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // 短暂延迟后添加高亮
    await new Promise((resolve) => setTimeout(resolve, 300))

    element.classList.add(HIGHLIGHT_CLASS)

    // 5 秒后自动移除高亮
    setTimeout(() => {
      element.classList.remove(HIGHLIGHT_CLASS)
    }, 5000)

    return {
      success: true,
      message: 'Element highlighted',
      data: {
        tagName: element.tagName.toLowerCase(),
        text: (element.textContent || '').trim().slice(0, 50),
      },
    }
  } catch (error) {
    return {
      success: false,
      error: 'highlight_failed',
      message: `Highlight failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
