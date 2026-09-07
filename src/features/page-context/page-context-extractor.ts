// 通用页面内容提取器
// 使用 @mcp-b/smart-dom-reader 提取：
// 1. 宿主网站的标题、URL、Meta 描述
// 2. 正文摘要（Markdown 格式，页面内容）
// 3. 可交互元素索引（Markdown 格式，LLM 生成 DOM 定位参数用）
import { SmartDOMReader, MarkdownFormatter } from "@mcp-b/smart-dom-reader"
import { createDebugLogger } from "@/utils/debug-log"

const debugLog = createDebugLogger("[page-context-extractor]")

// 页面基础信息（内部类型，用 TS 原生）
interface PageBasicInfo {
  readonly title: string
  readonly url: string
  readonly description: string
}

// 提取页面基础信息
const extractBasicInfo = (): PageBasicInfo => {
  const title = document.title || ""
  const url = window.location.href
  const description =
    document.querySelector('meta[name="description"]')?.getAttribute("content") ?? ""
  return { title, url, description }
}

// 提取正文内容（Markdown 格式）
const extractMainContent = (): string => {
  try {
    const pageBasic = extractBasicInfo()

    // extractFull 拿到页面结构，用 MarkdownFormatter.region 输出合并好的结构视图
    // 包含内容文本 + 语义元素（标题/表格/列表），主区域优先
    const full = SmartDOMReader.extractFull(document, {
      includeHidden: false,
      includeShadowDOM: true,
      includeIframes: true,
      mainContentOnly: true,
      textTruncateLength: 80,
      attributeTruncateLength: 60,
    })
    const regionMd = MarkdownFormatter.region(
      full,
      { detail: "deep", maxTextLength: 4000, maxElements: 150 },
      { title: pageBasic.title, url: pageBasic.url }
    )
    return regionMd.trim()
  } catch (err) {
    debugLog.log("[extractMainContent] smart-dom-reader failed, fallback to textContent:", err)
    const body = document.body.cloneNode(true) as HTMLElement
    body.querySelectorAll("script, style, noscript").forEach((el) => el.remove())
    return (body.textContent || "").trim().slice(0, 4000)
  }
}

// 可交互元素（补充了父链上下文文本）
interface EnrichedElement {
  readonly tag: string
  readonly text: string
  readonly dataAction: string
  readonly dataProductId: string
  readonly parentChain: string
  readonly bestSelector: string
  readonly disabled: boolean
}

// 从 smart-dom-reader 结果中提取所有可交互元素（统一处理）
const flattenElements = (result: unknown): Array<Record<string, unknown>> => {
  const all: Array<Record<string, unknown>> = []
  const interactive = (result as { interactive?: Record<string, unknown> }).interactive
  if (!interactive) return all
  for (const group of Object.values(interactive)) {
    if (Array.isArray(group)) {
      for (const item of group) {
        if (typeof item === "object" && item !== null) {
          all.push(item as Record<string, unknown>)
        }
      }
    }
  }
  return all
}

// 获取元素父链上下文文本（不依赖任何选择器，纯文本提取）
// 向上遍历 N 层，每层取文本摘要，全部传给 LLM 让它自己判断产品名/区域
const getParentChainText = (el: HTMLElement, maxLevels = 4): string => {
  const levels: string[] = []
  let current = el.parentElement

  for (let i = 0; i < maxLevels && current && current !== document.body; i++) {
    // 优先取该层的直接文本子节点，避免深层嵌套的文本干扰
    const directText = Array.from(current.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent?.trim() ?? "")
      .filter((text) => text.length > 0)
      .join(" ")

    // 直接文本太少时，用 textContent 截断兜底
    const text = directText || (current.textContent || "").trim().slice(0, 120)
    if (text) {
      levels.push(`L${i + 1}: ${text.slice(0, 120)}`)
    }
    current = current.parentElement
  }

  return levels.join(" → ")
}

// 为每个元素补充父链上下文，生成结构化结果
const enrichElements = (
  elements: Array<Record<string, unknown>>
): EnrichedElement[] => {
  return elements
    .filter((el) => {
      const text = String(el.text ?? "").trim()
      return text.length > 0
    })
    .map((el) => {
      // 用 smart-dom-reader 生成的最优选择器反查 DOM
      const selectorObj = el.selector as { css?: string; candidates?: Array<{ value?: string }> } | undefined
      const bestCandidate = selectorObj?.candidates?.[0]?.value ?? ""
      const cssSelector = selectorObj?.css ?? bestCandidate

      let domEl: HTMLElement | null = null
      if (cssSelector) {
        try {
          domEl = document.querySelector<HTMLElement>(cssSelector)
        } catch {
          // 选择器可能无效，跳过
        }
      }

      // 提取 data-* 属性（从 smart-dom-reader 的 attributes 或 DOM 元素上拿）
      const attrs = el.attributes as Record<string, string> | undefined
      const dataAction = attrs?.["data-assistant-action"] ?? domEl?.getAttribute("data-assistant-action") ?? ""
      const dataProductId =
        attrs?.["data-product-id"] ?? domEl?.getAttribute("data-product-id") ?? ""

      // 父链上下文文本（核心：不猜标题选择器，把上下文全给 LLM）
      const parentChain = domEl ? getParentChainText(domEl) : ""

      const interaction = el.interaction as { disabled?: boolean } | undefined

      return {
        tag: String(el.tag ?? ""),
        text: String(el.text ?? "").slice(0, 50),
        dataAction,
        dataProductId,
        parentChain,
        bestSelector: cssSelector,
        disabled: interaction?.disabled ?? false,
      }
    })
}

// 自定义 Markdown 表格输出（确保 LLM 能看到所有关键字段）
const formatToMarkdown = (elements: EnrichedElement[]): string => {
  if (elements.length === 0) return ""

  const header = "| # | 标签 | 元素文本 | data-action | data-product-id | 父链上下文（从近到远） | 最佳选择器 | 状态 |"
  const separator = "| --- | --- | --- | --- | --- | --- | --- | --- |"
  const rows = elements.map((el, i) => {
    return `| ${i + 1} | ${el.tag} | ${el.text} | ${el.dataAction} | ${el.dataProductId} | ${el.parentChain} | ${el.bestSelector} | ${el.disabled ? "disabled" : "active"} |`
  })

  return `${header}\n${separator}\n${rows.join("\n")}`
}

// 提取可交互元素索引（Markdown 表格，供 LLM 生成 DOM 定位参数）
const extractInteractiveIndex = (): string => {
  try {
    const result = SmartDOMReader.extractInteractive(document, {
      includeHidden: false,
      includeShadowDOM: true,
      includeIframes: true,
      viewportOnly: false,
      mainContentOnly: false,
      textTruncateLength: 80,
      attributeTruncateLength: 80,
    })

    const flat = flattenElements(result)
    const enriched = enrichElements(flat)
    return formatToMarkdown(enriched)
  } catch (err) {
    debugLog.log("[extractInteractiveIndex] smart-dom-reader failed, return empty:", err)
    return ""
  }
}

// 页面上下文提取结果
interface PageContextData {
  readonly pageTitle: string
  readonly pageUrl: string
  readonly pageDescription: string
  readonly pageContent: string
  readonly interactiveElements: string
}

// 页面上下文缓存（按 URL 缓存，避免同一页面重复提取）
let cachedContext: PageContextData | null = null
let cachedUrl = ""

// 刷新缓存：action 执行后页面 DOM 变化，需清除缓存
export const invalidatePageContextCache = (): void => {
  cachedContext = null
  cachedUrl = ""
}

// 提取完整页面上下文（带缓存）
export const extractPageContext = (): PageContextData => {
  const currentUrl = window.location.href

  // URL 未变且缓存存在 → 直接返回缓存
  if (cachedUrl === currentUrl && cachedContext) {
    return cachedContext
  }

  const basic = extractBasicInfo()
  const content = extractMainContent()
  const interactive = extractInteractiveIndex()

  cachedContext = {
    pageTitle: basic.title,
    pageUrl: basic.url,
    pageDescription: basic.description,
    pageContent: content,
    interactiveElements: interactive,
  }
  cachedUrl = currentUrl

  return cachedContext
}
