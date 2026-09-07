import { createDebugLogger } from "@/utils/debug-log";

// Action 元素定位器
// 4 维策略查找：data-attribute → anchor-context → text-match → css-selector

const debugLog = createDebugLogger("[action-resolver]");

// 锚点定位参数
interface AnchorContext {
  readonly anchorText: string;
  readonly targetSelector: string;
}

// 元素查找参数（与 Prompt 4 维策略对齐）
interface ElementResolverParams {
  readonly dataAttributes?: string; // 策略 1: data-* 选择器
  readonly anchorContext?: AnchorContext; // 策略 2: 锚点隔离
  readonly textMatch?: string; // 策略 3: 文本精准匹配
  readonly cssSelector?: string; // 策略 4: CSS 选择器兜底
}

// 查找结果
interface ResolvedElement {
  readonly element: HTMLElement;
  readonly strategy: string;
}

// 检查元素是否可见（避免操作隐藏元素）
const isVisible = (el: HTMLElement): boolean => {
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

// 策略 1: data-* 属性查找（最可靠）
const findByDataAttributes = (selector: string): HTMLElement | null => {
  try {
    const el = document.querySelector<HTMLElement>(selector);
    if (el && isVisible(el)) return el;
  } catch {
    debugLog.log("[strategy-1] invalid data_attributes selector:", selector);
  }
  return null;
};

// 策略 2: 锚点隔离查找
// 用 TreeWalker 只遍历文本节点，避免 querySelectorAll('*') 全页遍历
const findByAnchorContext = (anchorText: string, targetSelector: string): HTMLElement | null => {
  if (!anchorText) return null;
  const cleanText = anchorText.trim();

  // 用 TreeWalker 遍历文本节点，找到包含锚点文本的叶子元素
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node: Text) => {
      if (node.textContent?.trim().includes(cleanText)) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_REJECT;
    }
  });

  const textNode = walker.nextNode() as Text | null;
  if (!textNode?.parentElement) return null;

  const anchorEl = textNode.parentElement;
  if (!isVisible(anchorEl)) return null;

  // 沿 DOM 树向上寻找目标元素（最多 6 层）
  let container: HTMLElement | null = anchorEl.parentElement;
  for (let i = 0; i < 6 && container && container !== document.body; i++) {
    const target = container.querySelector<HTMLElement>(targetSelector);
    if (target && isVisible(target)) return target;
    container = container.parentElement;
  }
  return null;
};

// 策略 3: 文本精准匹配
// 限定可交互元素，避免遍历全页 div/span
const findByTextMatch = (text: string = ""): HTMLElement | null => {
  const cleanText = text.trim();
  const interactiveSelector = 'button, a, [role="button"], input[type="submit"], input[type="button"]';
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(interactiveSelector));

  // 精确匹配优先
  for (const el of candidates) {
    const elText = (el.textContent || "").trim();
    if (elText === cleanText && isVisible(el)) return el;
  }

  // 包含匹配兜底（处理按钮文本带额外空格等情况）
  for (const el of candidates) {
    const elText = (el.textContent || "").trim();
    if (elText.includes(cleanText) && isVisible(el)) return el;
  }

  return null;
};

// 策略 4: CSS 选择器兜底
export const findByCssSelector = (selector: string): HTMLElement | null => {
  try {
    const el = document.querySelector<HTMLElement>(selector);
    if (el && isVisible(el)) return el;
  } catch {
    debugLog.log("[strategy-4] invalid css_selector:", selector);
  }
  return null;
};

// 多策略元素查找入口（4 层降级）
export const resolveElement = (params: ElementResolverParams): ResolvedElement | null => {
  debugLog.log("[resolveElement] params:", params);

  // 策略 1: data-* 属性
  if (params.dataAttributes) {
    const el = findByDataAttributes(params.dataAttributes);
    if (el) return { element: el, strategy: "data-attribute" };
  }

  // 策略 2: 锚点隔离
  if (params.anchorContext) {
    const el = findByAnchorContext(params.anchorContext.anchorText, params.anchorContext.targetSelector);
    if (el) return { element: el, strategy: "anchor-context" };
  }

  // 策略 3: 文本匹配
  if (params.textMatch) {
    const el = findByTextMatch(params.textMatch);
    if (el) return { element: el, strategy: "text-match" };
  }

  // 策略 4: CSS 选择器
  if (params.cssSelector) {
    const el = findByCssSelector(params.cssSelector);
    if (el) return { element: el, strategy: "css-selector" };
  }

  return null;
};
