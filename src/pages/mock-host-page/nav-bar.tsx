import { ICONS } from "@/constants/icon";
import type { FC } from "react";

// Mock 宿主页面导航栏
// 注意：本组件模拟"宿主网站"原始 HTML，非 AI 助手 App 本身
// 使用原生 input/button 符合真实宿主网站场景，不受 HeroUI 规范约束
// 原生元素带 data-assistant-* 属性，供 AI 助手定位和操作

interface NavBarProps {
  readonly cartCount: number;
  readonly searchValue: string;
  readonly onSearchChange: (value: string) => void;
  readonly onSearch: () => void;
}

// 顶部导航栏 - 模拟电商网站导航
const NavBar: FC<NavBarProps> = ({ cartCount, searchValue, onSearchChange, onSearch }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <ICONS.tag size={24} className="text-blue-600" />
          <span className="text-lg font-bold text-gray-800">MockShop</span>
        </div>

        {/* 导航链接 */}
        <nav className="hidden items-center gap-4 text-sm text-gray-600 md:flex">
          <a href="#" className="hover:text-blue-600">
            首页
          </a>
          <a href="#" className="hover:text-blue-600">
            数码
          </a>
          <a href="#" className="hover:text-blue-600">
            服饰
          </a>
          <a href="#" className="hover:text-blue-600">
            家居
          </a>
        </nav>

        {/* 搜索框 - 带 data 属性供 AI 助手定位 */}
        <div className="flex flex-1 items-center">
          <input
            type="text"
            placeholder="Search products..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
            data-assistant-action="search-input"
          />
          <button
            onClick={onSearch}
            className="ml-2 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white hover:bg-blue-600"
            data-assistant-action="search-button">
            <ICONS.search size={16} />
          </button>
        </div>

        {/* 用户/购物车图标 */}
        <div className="flex items-center gap-3">
          <button className="text-gray-600 hover:text-blue-600">
            <ICONS.user size={20} />
          </button>
          <button className="relative text-gray-600 hover:text-blue-600">
            <ICONS.cartPlus size={20} />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
