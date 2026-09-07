// 电商页面商品信息检测器
// 识别当前页面是否为商品页，并提取商品名称、价格、SKU 等信息

// 商品信息结构（内部类型，用 TS 原生）
interface ProductInfo {
  readonly name: string
  readonly price: string
  readonly sku: string
  readonly availability: string
  readonly found: boolean
}

// 空商品信息（未检测到时返回）
const EMPTY_PRODUCT: ProductInfo = {
  name: '',
  price: '',
  sku: '',
  availability: '',
  found: false,
}

// 优先使用 Schema.org 结构化数据（JSON-LD）
const detectFromJsonLd = (): ProductInfo | null => {
  const scripts = document.querySelectorAll('script[type="application/ld+json]')

  for (const script of scripts) {
    try {
      const data: unknown = JSON.parse(script.textContent || '')
      // 处理 @graph 数组或单个对象
      const candidates = Array.isArray(data) ? data : [data]
      for (const item of candidates) {
        const obj = item as Record<string, unknown>
        const graph = obj['@graph']
        if (Array.isArray(graph)) {
          for (const g of graph) {
            const result = parseSchemaOrgProduct(g as Record<string, unknown>)
            if (result) return result
          }
        }
        const result = parseSchemaOrgProduct(obj)
        if (result) return result
      }
    } catch {
      // JSON 解析失败，跳过
    }
  }
  return null
}

// 解析 Schema.org Product 类型
const parseSchemaOrgProduct = (obj: Record<string, unknown>): ProductInfo | null => {
  const type = obj['@type']
  if (typeof type !== 'string' || !type.includes('Product')) return null

  const name = typeof obj['name'] === 'string' ? obj['name'] : ''
  const offers = obj['offers'] as Record<string, unknown> | undefined

  return {
    name,
    price: typeof offers?.['price'] === 'string' ? offers['price'] : '',
    sku: typeof obj['sku'] === 'string' ? obj['sku'] : '',
    availability:
      typeof obj['availability'] === 'string'
        ? obj['availability'].replace('https://schema.org/', '')
        : '',
    found: true,
  }
}

// 降级策略：通过 meta 标签和常见选择器检测
const detectFromSelectors = (): ProductInfo => {
  // OG 标签获取商品名
  const ogTitle = document
    .querySelector('meta[property="og:title"]')
    ?.getAttribute('content')

  // 常见价格选择器（覆盖主流电商）
  const priceSelectors = [
    '.price',
    '.product-price',
    '[data-price]',
    '[itemprop="price"]',
    '.price-current',
  ]

  let price = ''
  for (const selector of priceSelectors) {
    const el = document.querySelector(selector)
    if (el?.textContent?.trim()) {
      price = el.textContent.trim()
      break
    }
  }

  const name = ogTitle || document.title || ''

  return name || price
    ? { name, price, sku: '', availability: '', found: true }
    : EMPTY_PRODUCT
}

// 检测当前页面商品信息
export const detectProduct = (): ProductInfo => {
  // 优先用结构化数据
  const fromJsonLd = detectFromJsonLd()
  if (fromJsonLd) return fromJsonLd

  // 降级到选择器匹配
  return detectFromSelectors()
}
