import { Button } from '@heroui/react'
import { Ripple } from 'm3-ripple'
import { ICONS } from '@/constants/icon'
import type { FC } from 'react'

// Mock 商品数据（内部类型，用 TS 原生）
export interface MockProduct {
  readonly id: string
  readonly name: string
  readonly price: number
  readonly originalPrice?: number
  readonly image: string
  readonly rating: number
  readonly tag?: string
}

// 商品卡片 Props
interface ProductCardProps {
  readonly product: MockProduct
  readonly onAddToCart: (product: MockProduct) => void
}

// 商品卡片组件 - 模拟电商网站商品展示
const ProductCard: FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <div
      data-product-id={product.id}
      data-product-name={product.name}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg"
    >
      {/* 商品图片 */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        {product.tag && (
          <span className="absolute left-2 top-2 rounded bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
            {product.tag}
          </span>
        )}
        <button className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-600 hover:bg-white">
          <ICONS.heart size={16} />
        </button>
      </div>

      {/* 商品信息 */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="mb-1 line-clamp-2 text-sm font-medium text-gray-800">
          {product.name}
        </h3>

        {/* 评分 */}
        <div className="mb-2 flex items-center gap-1">
          <ICONS.star size={12} className="text-yellow-400" />
          <span className="text-xs text-gray-500">{product.rating}</span>
        </div>

        {/* 价格 */}
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-red-500">
            ¥{product.price}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-gray-400 line-through">
              ¥{product.originalPrice}
            </span>
          )}
        </div>

        {/* 加购按钮 - 带 data 属性便于 AI 助手定位 */}
        <Button
          variant="primary"
          size="sm"
          className="mt-auto w-full"
          data-assistant-action="add-to-cart"
          data-product-id={product.id}
          onPress={() => onAddToCart(product)}
        >
          <ICONS.cartPlus size={14} />
          加入购物车
          <Ripple />
        </Button>
      </div>
    </div>
  )
}

export default ProductCard
