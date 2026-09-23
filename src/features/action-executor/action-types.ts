// Action 共享类型定义
// 内部类型，用 TS 原生 interface/type

// 批量填充字段定义
export interface FieldDef {
  readonly css_selector?: string
  readonly text_match?: string
  readonly data_attributes?: string
  readonly anchor_context?: string
  readonly value: string
}

// Action 执行参数
export interface ActionParams {
  /** 已解析的目标元素（由 action-resolver 提供） */
  readonly element?: HTMLElement
  /** 填充值（fill action 使用） */
  readonly value?: string
  /** 目标 URL（navigate action 使用） */
  readonly url?: string
  /** 滚动位置（scroll action 使用） */
  readonly position?: 'top' | 'bottom'
  /** 批量填充字段列表（batch_fill 使用） */
  readonly fields?: readonly FieldDef[]
}

// Action 执行结果
export interface ActionResult {
  readonly success: boolean
  readonly message: string
  readonly error?: string
  readonly data?: Record<string, unknown>
}

// 锚点定位参数（与 action-resolver 的 AnchorContext 对齐）
export interface AnchorContext {
  readonly anchorText: string
  readonly targetSelector: string
}

// Action 调用指令（从 AI 回复中解析）
export interface ActionCall {
  /** 工具名称 */
  readonly tool: string
  /** 工具参数（4 维定位 + 操作参数） */
  readonly params: {
    // 4 维元素定位参数
    readonly data_attributes?: string
    readonly anchor_context?: AnchorContext
    readonly text_match?: string
    readonly css_selector?: string
    // 操作参数
    readonly value?: string
    readonly url?: string
    readonly position?: 'top' | 'bottom'
    // 批量填充字段
    readonly fields?: readonly FieldDef[]
  }
  /** 是否需要用户确认（默认 false） */
  readonly confirmRequired?: boolean
}
