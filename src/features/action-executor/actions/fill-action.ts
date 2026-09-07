import type { ActionResult, ActionParams } from '../action-types'

// 填充输入框 Action
// 用于搜索框输入、表单填充等场景

export const executeFill = async (params: ActionParams): Promise<ActionResult> => {
  const { element, value } = params

  if (!element) {
    return {
      success: false,
      error: 'element_not_found',
      message: 'Target input element not found',
    }
  }

  // 检查是否为输入元素
  const isInput =
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element.getAttribute('contenteditable') === 'true'

  if (!isInput) {
    return {
      success: false,
      error: 'element_not_input',
      message: 'Target element is not an input',
    }
  }

  if (!value) {
    return {
      success: false,
      error: 'value_required',
      message: 'A value parameter is required for fill',
    }
  }

  try {
    // 聚焦元素
    element.focus()

    // 清空原有内容
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      // 使用 React 兼容的方式设置值
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        element instanceof HTMLInputElement
          ? HTMLInputElement.prototype
          : HTMLTextAreaElement.prototype,
        'value',
      )?.set

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, value)
      } else {
        element.value = value
      }

      // 触发 input 事件让 React 感知变化
      element.dispatchEvent(new Event('input', { bubbles: true }))
      element.dispatchEvent(new Event('change', { bubbles: true }))

      // 提交父表单（覆盖 <form> 内搜索框）
      const form = element.closest('form')
      if (form) {
        form.requestSubmit()
      } else {
        // Fallback: 查找最近的按钮（覆盖独立 input + button 结构）
        // 从 input 的父容器开始，向上查 2 层，找第一个可点击元素
        let current = element.parentElement
        for (let i = 0; i < 2 && current; i++) {
          const btn = current.querySelector<HTMLElement>(
            'button, input[type="submit"], input[type="button"], a[role="button"], [role="button"]'
          )
          if (btn && btn !== element) {
            btn.click()
            break
          }
          current = current.parentElement
        }
      }
    }

    return {
      success: true,
      message: `Filled with: "${value}"`,
      data: { value },
    }
  } catch (error) {
    return {
      success: false,
      error: 'fill_failed',
      message: `Fill failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
