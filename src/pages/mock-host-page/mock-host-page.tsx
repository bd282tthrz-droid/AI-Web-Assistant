import { useState } from "react";
import { ICONS } from "@/constants/icon";
import NavBar from "./nav-bar";
import ProductCard, { type MockProduct } from "./product-card";
import type { FC } from "react";

// Mock 商品数据 - 模拟电商网站商品
const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "p001",
    name: "无线蓝牙耳机 Pro Max 降噪头戴式",
    price: 1299,
    originalPrice: 1599,
    image: "https://picsum.photos/seed/headphone/400/400",
    rating: 4.8,
    tag: "热销"
  },
  {
    id: "p002",
    name: "智能手表 Series 9 运动健康监测",
    price: 2499,
    originalPrice: 2999,
    image: "https://picsum.photos/seed/watch/400/400",
    rating: 4.9,
    tag: "新品"
  },
  {
    id: "p003",
    name: "机械键盘 RGB 背光 87 键客制化",
    price: 599,
    image: "https://picsum.photos/seed/keyboard/400/400",
    rating: 4.7
  },
  {
    id: "p004",
    name: "便携充电宝 20000mAh 快充",
    price: 159,
    originalPrice: 199,
    image: "https://picsum.photos/seed/powerbank/400/400",
    rating: 4.6,
    tag: "促销"
  }
];

// Mock 宿主页面 Props - 接收 AI 助手 Widget 作为 children 渲染
interface MockHostPageProps {
  readonly children?: React.ReactNode;
}

// Mock 宿主页面 - 模拟电商网站，用于开发阶段验证 AI 助手嵌入效果
// 生产构建时不包含此页面，只输出纯 AI 助手 Widget
const MockHostPage: FC<MockHostPageProps> = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [searchHint, setSearchHint] = useState("");

  // 加购物车处理
  const handleAddToCart = (product: MockProduct) => {
    setCartCount((prev) => prev + 1);
    setSearchHint(`已将「${product.name}」加入购物车`);
    setTimeout(() => setSearchHint(""), 2000);
  };

  // 搜索处理
  const handleSearch = () => {
    if (!searchValue.trim()) return;
    setSearchHint(`搜索：${searchValue}`);
    setTimeout(() => setSearchHint(""), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar cartCount={cartCount} searchValue={searchValue} onSearchChange={setSearchValue} onSearch={handleSearch} />

      {/* 搜索提示 */}
      {searchHint && (
        <div className="fixed left-1/2 top-16 z-50 -translate-x-1/2 rounded-lg bg-green-500 px-4 py-2 text-sm text-white shadow-lg">
          <ICONS.success size={14} className="mr-1 inline" />
          {searchHint}
        </div>
      )}

      {/* 主内容区 - 包含 banner 和商品列表 */}
      <main data-page-type="home" className="mx-auto max-w-6xl px-4 py-6">
        {/* Banner */}
        <div className="mb-6 flex h-48 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold">MockShop 电商平台</h1>
            <p className="text-sm opacity-90">这是用于开发测试的模拟宿主网站</p>
          </div>
        </div>

        {/* 商品列表标题 */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">热门商品</h2>
          <span className="text-sm text-gray-500">{MOCK_PRODUCTS.length} 件商品</span>
        </div>

        {/* 商品网格 */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {MOCK_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
        <div className="container mx-auto px-4 py-6">
          <div className="text-sm text-gray-500 mb-6 flex items-center space-x-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"></path>
            </svg>
            <a className="hover:text-teal" href="#">
              Home
            </a>
            <span className="mx-1">/</span>
            <a className="hover:text-teal" href="#">
              Products
            </a>
            <span className="mx-1">/</span>
            <a className="hover:text-teal" href="#">
              Protein Type
            </a>
            <span className="mx-1">/</span>
            <a className="hover:text-teal" href="#">
              Recombinant Proteins
            </a>
            <span className="mx-1">/</span>
            <span className="text-gray-700 font-medium">Full Length Protein</span>
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8 pb-4 border-b">Full Length Protein</h1>

          <div className="flex space-x-1 mb-6 border-b border-teal pb-[1px]">
            <a className="bg-teal text-white px-6 py-2 rounded-t font-semibold" href="#">
              Product List
            </a>
            <a
              className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-6 py-2 rounded-t font-semibold"
              href="#background">
              Background
            </a>
            <a
              className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-6 py-2 rounded-t font-semibold"
              href="#applications">
              Applications
            </a>
            <a
              className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-6 py-2 rounded-t font-semibold"
              href="#case-study">
              Case Study
            </a>
            <a
              className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-6 py-2 rounded-t font-semibold"
              href="#advantages">
              Advantages
            </a>
            <a className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-6 py-2 rounded-t font-semibold" href="#faq">
              FAQ
            </a>
          </div>
          <div className="flex flex-wrap gap-4 mb-8">
            <select className="filter-select border border-gray-300 rounded px-3 py-1.5 min-w-[150px] text-sm focus:border-teal outline-none">
              <option>Classification</option>
            </select>
            <select className="filter-select border border-gray-300 rounded px-3 py-1.5 min-w-[150px] text-sm focus:border-teal outline-none">
              <option>Genes</option>
            </select>
            <select className="filter-select border border-gray-300 rounded px-3 py-1.5 min-w-[150px] text-sm focus:border-teal outline-none">
              <option>Species</option>
            </select>
            <select className="filter-select border border-gray-300 rounded px-3 py-1.5 min-w-[150px] text-sm focus:border-teal outline-none">
              <option>Sources</option>
            </select>
            <select className="filter-select border border-gray-300 rounded px-3 py-1.5 min-w-[150px] text-sm focus:border-teal outline-none">
              <option>Tags</option>
            </select>
          </div>
          <div className="mb-8">
            <div className="table-row-border pb-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex-grow max-w-3xl">
                <h3 className="text-teal font-semibold text-lg mb-2 hover:underline cursor-pointer flex items-center">
                  Recombinant Full Length Human RAP1A Protein, His-tagged
                  <span className="bg-red-100 text-red-500 text-xs px-1 ml-2 rounded border border-red-200">
                    Full L.
                  </span>
                </h3>
                <div className="text-orange font-medium mb-3 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"></path>
                  </svg>
                  RAP1A-2584H
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-700">
                  <div>
                    <span className="font-semibold text-black">Source:</span>
                    E.coli
                  </div>
                  <div>
                    <span className="font-semibold text-black">Species:</span>
                    Human
                  </div>
                  <div>
                    <span className="font-semibold text-black">Tag:</span>
                    His
                  </div>
                  <div>
                    <span className="font-semibold text-black">Conjugation:</span>
                  </div>
                  <div>
                    <span className="font-semibold text-black">Protein Length:</span>
                    1-184 aa
                  </div>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex flex-col items-end w-full md:w-auto">
                <div className="border border-gray-200 px-4 py-2 mb-3 text-center min-w-[120px] text-gray-800">
                  $319 / 25μg
                </div>
                <div className="flex space-x-2">
                  <button
                    className="btn-orange px-3 py-1.5 rounded text-sm flex items-center"
                    data-name="Recombinant Full Length Human RAP1A Protein, His-tagged">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"></path>
                    </svg>
                    Add to Cart
                  </button>
                  <button className="btn-blue px-3 py-1.5 rounded text-sm flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"></path>
                    </svg>
                    Compare
                  </button>
                </div>
              </div>
              <div className="mt-4 md:mt-0 md:ml-6 flex-shrink-0">
                <img
                  alt="Western Blot Image"
                  className="border border-gray-200 p-1 bg-white h-24"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBL4kBW7O4yscPPCG_5yVww8tOG641u0D5xdgxQm-OFv_DCN0rqll8PyWBrCXB4rj3OheIpi0Jb4Ob0VCE5P6aCqpPEHCpEDsEBO7B8fXNZGm349HCYh30v0PZok5G_brqP9egF5uI0KY6ryxk6hahycZO76BAxhrz3Hm19gDpy-ZN4MsmRD9QnF776u9WgkvDFJvJNOTFT-vBCuMDkjivqMCf5-pZvEUnQ7g8GZl9xRfC-i8meNjPB"
                />
              </div>
            </div>
            <div className="table-row-border pb-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex-grow max-w-3xl">
                <h3 className="text-teal font-semibold text-lg mb-2 hover:underline cursor-pointer flex items-center">
                  Recombinant Human EGF Protein
                  <span className="bg-red-500 text-white text-xs px-1 ml-2 rounded uppercase font-bold">Hot</span>
                </h3>
                <div className="text-orange font-medium mb-3 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"></path>
                  </svg>
                  EGF-04H
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-700">
                  <div>
                    <span className="font-semibold text-black">Source:</span>
                    E.coli
                  </div>
                  <div>
                    <span className="font-semibold text-black">Species:</span>
                    Human
                  </div>
                  <div>
                    <span className="font-semibold text-black">Tag:</span>
                  </div>
                  <div>
                    <span className="font-semibold text-black">Conjugation:</span>
                  </div>
                  <div>
                    <span className="font-semibold text-black">Protein Length:</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex flex-col items-end w-full md:w-auto">
                <div className="border border-gray-200 px-4 py-2 mb-3 text-center min-w-[120px] text-gray-800">
                  $298 / 1mg
                </div>
                <div className="flex space-x-2">
                  <button
                    className="btn-orange px-3 py-1.5 rounded text-sm flex items-center"
                    data-name="Recombinant Human EGF Protein">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"></path>
                    </svg>
                    Add to Cart
                  </button>
                  <button className="btn-blue px-3 py-1.5 rounded text-sm flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"></path>
                    </svg>
                    Compare
                  </button>
                </div>
              </div>
              <div className="mt-4 md:mt-0 md:ml-6 flex-shrink-0">
                <img
                  alt="Product Vial"
                  className="border border-gray-200 p-1 bg-white h-24"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0uW5jQUYCO-9CzHp6A59wo1aoR-vhLtwhPsRQ4N6EwVerr_w2jll1A2I8JSROzQ5jaBkejqy3QPfJIV46E8dUuWyu7dz8D-bdVWjEEHlxl3jBjJd58Zvb8AZzZzlYRpOUnS4bCggGJpwmDlOxTHMtZ9xSCPMQZ94LjGfKrgaqk-qkWlY_OeaAEAIQE9Y8Tmal4w8Hdk73JrAwxD84RGQuwSWcuaQ4bBZa3Yz1MVD8WJ03Ez5ORfM1"
                />
              </div>
            </div>
            <div className="table-row-border pb-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex-grow max-w-3xl">
                <h3 className="text-teal font-semibold text-lg mb-2 hover:underline cursor-pointer flex items-center">
                  Recombinant Full Length Human S100 calcium binding protein A4 Protein, His tagged
                  <span className="bg-red-500 text-white text-xs px-1 ml-2 rounded uppercase font-bold">Hot</span>
                </h3>
                <div className="text-orange font-medium mb-3 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"></path>
                  </svg>
                  EGF-04H
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-700">
                  <div>
                    <span className="font-semibold text-black">Source:</span>
                    E.coli
                  </div>
                  <div>
                    <span className="font-semibold text-black">Species:</span>
                    Human
                  </div>
                  <div>
                    <span className="font-semibold text-black">Tag:</span>
                  </div>
                  <div>
                    <span className="font-semibold text-black">Conjugation:</span>
                  </div>
                  <div>
                    <span className="font-semibold text-black">Protein Length:</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex flex-col items-end w-full md:w-auto">
                <div className="border border-gray-200 px-4 py-2 mb-3 text-center min-w-[120px] text-gray-800">
                  $298 / 1mg
                </div>
                <div className="flex space-x-2">
                  <button
                    className="btn-orange px-3 py-1.5 rounded text-sm flex items-center"
                    data-name="Recombinant Full Length Human S100 calcium binding protein A4 Protein, His tagged">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"></path>
                    </svg>
                    Add to Cart
                  </button>
                  <button className="btn-blue px-3 py-1.5 rounded text-sm flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"></path>
                    </svg>
                    Compare
                  </button>
                </div>
              </div>
              <div className="mt-4 md:mt-0 md:ml-6 flex-shrink-0">
                <img
                  alt="Product Vial"
                  className="border border-gray-200 p-1 bg-white h-24"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0uW5jQUYCO-9CzHp6A59wo1aoR-vhLtwhPsRQ4N6EwVerr_w2jll1A2I8JSROzQ5jaBkejqy3QPfJIV46E8dUuWyu7dz8D-bdVWjEEHlxl3jBjJd58Zvb8AZzZzlYRpOUnS4bCggGJpwmDlOxTHMtZ9xSCPMQZ94LjGfKrgaqk-qkWlY_OeaAEAIQE9Y8Tmal4w8Hdk73JrAwxD84RGQuwSWcuaQ4bBZa3Yz1MVD8WJ03Ez5ORfM1"
                />
              </div>
            </div>
            <div className="table-row-border pb-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex-grow max-w-3xl">
                <h3 className="text-teal font-semibold text-lg mb-2 hover:underline cursor-pointer flex items-center">
                  Recombinant Full Length Human hexokinase 2 Protein, His tagged
                  <span className="bg-red-500 text-white text-xs px-1 ml-2 rounded uppercase font-bold">Hot</span>
                </h3>
                <div className="text-orange font-medium mb-3 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"></path>
                  </svg>
                  EGF-04H
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-700">
                  <div>
                    <span className="font-semibold text-black">Source:</span>
                    E.coli
                  </div>
                  <div>
                    <span className="font-semibold text-black">Species:</span>
                    Human
                  </div>
                  <div>
                    <span className="font-semibold text-black">Tag:</span>
                  </div>
                  <div>
                    <span className="font-semibold text-black">Conjugation:</span>
                  </div>
                  <div>
                    <span className="font-semibold text-black">Protein Length:</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex flex-col items-end w-full md:w-auto">
                <div className="border border-gray-200 px-4 py-2 mb-3 text-center min-w-[120px] text-gray-800">
                  $298 / 1mg
                </div>
                <div className="flex space-x-2">
                  <button
                    className="btn-orange px-3 py-1.5 rounded text-sm flex items-center"
                    data-name="Recombinant Full Length Human hexokinase 2 Protein, His tagged">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"></path>
                    </svg>
                    Add to Cart
                  </button>
                  <button className="btn-blue px-3 py-1.5 rounded text-sm flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"></path>
                    </svg>
                    Compare
                  </button>
                </div>
              </div>
              <div className="mt-4 md:mt-0 md:ml-6 flex-shrink-0">
                <img
                  alt="Product Vial"
                  className="border border-gray-200 p-1 bg-white h-24"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0uW5jQUYCO-9CzHp6A59wo1aoR-vhLtwhPsRQ4N6EwVerr_w2jll1A2I8JSROzQ5jaBkejqy3QPfJIV46E8dUuWyu7dz8D-bdVWjEEHlxl3jBjJd58Zvb8AZzZzlYRpOUnS4bCggGJpwmDlOxTHMtZ9xSCPMQZ94LjGfKrgaqk-qkWlY_OeaAEAIQE9Y8Tmal4w8Hdk73JrAwxD84RGQuwSWcuaQ4bBZa3Yz1MVD8WJ03Ez5ORfM1"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-center items-center space-x-1 mb-12">
            <button className="pagination-btn px-3 py-1 rounded text-sm cursor-not-allowed opacity-50">First</button>
            <button className="pagination-btn px-3 py-1 rounded text-sm cursor-not-allowed opacity-50">&lt;&lt;</button>
            <button className="pagination-active px-3 py-1 rounded text-sm font-semibold">1</button>
            <a className="pagination-btn px-3 py-1 rounded text-sm" href="#">
              2
            </a>
            <a className="pagination-btn px-3 py-1 rounded text-sm" href="#">
              3
            </a>
            <a className="pagination-btn px-3 py-1 rounded text-sm" href="#">
              4
            </a>
            <a className="pagination-btn px-3 py-1 rounded text-sm" href="#">
              5
            </a>
            <a className="pagination-btn px-3 py-1 rounded text-sm" href="#">
              6
            </a>
            <a className="pagination-btn px-3 py-1 rounded text-sm" href="#">
              7
            </a>
            <a className="pagination-btn px-3 py-1 rounded text-sm" href="#">
              8
            </a>
            <a className="pagination-btn px-3 py-1 rounded text-sm" href="#">
              9
            </a>
            <a className="pagination-btn px-3 py-1 rounded text-sm" href="#">
              10
            </a>
            <span className="px-2 text-gray-500">...</span>
            <a className="pagination-btn px-3 py-1 rounded text-sm" href="#">
              &gt;&gt;
            </a>
            <a className="pagination-btn px-3 py-1 rounded text-sm" href="#">
              Last
            </a>
          </div>
          <section className="mb-10" id="background">
            <h2 className="text-2xl font-semibold text-teal border-b-2 border-teal pb-2 mb-4">Background</h2>
            <h3 className="text-lg font-semibold text-teal mb-3 pl-3 border-l-4 border-teal">Overview</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              A full-length protein is a complete protein sequence from the N terminal to the C terminal. The complete
              amino acid sequence of the protein can be obtained by full length protein sequencing, which is essential
              for understanding the biological function of the protein. It helps scientists fully understand the
              function of proteins, including how they interact with other molecules, as well as their localization and
              mechanism of action within cells. The study of full length proteins can reveal the role of specific
              proteins in the development of diseases, which is of great significance for the discovery of new
              therapeutic targets and methods. In addition, structural analysis of full length proteins can provide
              detailed information about the three-dimensional structure of proteins, which is of guiding significance
              for understanding their functions and designing experiments.
            </p>
            <div className="flex justify-center mb-8">
              <img
                alt="Protein Structure Model 1"
                className="rounded max-w-full h-auto"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjiSGWS1vwsdNoSTu5vDoEaJHAzR4mmzlbKFdmbpa7E0tgS2tjrsg1S8lZThy1ylCDJS-hnvyoLIREx1k1PBahjXeQegngQy7VGnsuAdYu2oeK5QNessWe3fKGERbNzCt9geXy60d5Bb4o9lm8HQqI47_gf7SDiOLfHk73BZMJOIbukZctFGFA0APvqxUAT6S4mG6nizbPgKo-BhimXGqN2F08QvFcE1xc1DZtrmkgiYSO6GcqtzUK"
              />
            </div>
            <h3 className="text-lg font-semibold text-teal mb-3 pl-3 border-l-4 border-teal">Challenges</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              In biological research, the study of full-length proteins is of great significance because their structure
              often determines their function. However, there are many problems in the process of expression. For
              example:
            </p>
            <ul className="list-disc pl-5 text-gray-700 leading-relaxed space-y-2 mb-6">
              <li>
                <strong>Expression challenges:</strong>
                The expression of full-length proteins in prokaryotic cells such as E. coli may be affected by a variety
                of factors, including protein hydrophilicity, codon rarity, and protein toxicity. For example, proteins
                that are too hydrophobic are difficult to express, and proteins that contain multiple rare codons linked
                together may also cause difficulty in expression. In order to solve these problems, researchers need to
                analyze the protein sequence and secondary structure, and adopt corresponding strategies to optimize the
                expression conditions.
              </li>
              <li>
                <strong>Translation initiation problems:</strong>
                When expressing full-length proteins, problems with truncated products may be encountered. This may be
                due to proteolysis or improper initiation of translation. To ensure the acquisition of full-length
                proteins, expression vectors with fusion labels on both ends can be used to distinguish full-length
                proteins from truncated proteins by increasing the imidazole concentration at elution.
              </li>
              <li>
                <strong>Transmembrane protein challenges:</strong>
                For specific full-length proteins such as transmembrane proteins, their expression and purification are
                particularly challenging. To facilitate drug development, the MNP platform extracts high-purity
                nanoscale cell membrane particles while maintaining the conformation and activity of membrane proteins.
              </li>
            </ul>
            <div className="flex justify-center mb-8">
              <img
                alt="Protein Structure Model 2"
                className="rounded max-w-full h-auto"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhZUsWGG8-2XyF4fVsTVxiFxSLSK_xqUBvR2MSyZmo8O8-nffK57IeL2O8WxFi_86PCMrmJWLffynx_d9ZoP2aYmrHB6k9uO6zFI5dGvm4KUvWqOwf2TabeGJTmY0bVYC2xf_TdRRLu67bMU9pAfmbRc_coDseS9wlQWa8bpKwuJFKxEGzj9RsemF8U0Zq788HL2EUDPVDdBcAe7dOASoEIic4jUj2zMCuhw4E5H759sThxfMq7ZGt"
              />
            </div>
            <h3 className="text-lg font-semibold text-teal mb-3 pl-3 border-l-4 border-teal">Outlook</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              The future of full-length protein research is full of promise and challenges, and with the continuous
              advancement of technology, there are already many biologically important recombinant protein classes on
              the market today. In the future, full-length proteins are expected to make breakthroughs in many other
              areas. Including but not limited to:
            </p>
            <ul className="list-disc pl-5 text-gray-700 leading-relaxed space-y-2 mb-6">
              <li>
                <strong>Improved accuracy of protein structure prediction:</strong>
                With the development of AI-based protein structure prediction technologies such as AlphaFold2, the
                ability of these technologies to predict the three-dimensional structure of unknown proteins will become
                even more powerful in the future. This enhancement will not only lead to a better understanding of
                protein function, but also accelerate the process of drug discovery and biological research.
              </li>
              <li>
                <strong>Research on multi-domain proteins and complexes:</strong>
                At present, there are still challenges in predicting the structure of multi-domain proteins and protein
                complexes. Future research may lead to breakthroughs in these areas, leading to a more complete
                understanding of protein complexity and diversity.
              </li>
              <li>
                <strong>Innovative applications of protein design:</strong>
                The application of deep learning techniques has made it possible to design completely new proteins from
                scratch. In the future, this technology may be further developed to create customized proteins with
                specific functions, such as enzymes, vaccines, and drug delivery vectors, which will have a profound
                impact on the pharmaceutical and biotechnology industries.
              </li>
              <li>
                <strong>Improvement of computational tools and databases:</strong>
                With the accumulation of more and more information about protein sequences and their structures,
                combined with advances in artificial intelligence technology, more efficient computational tools and
                databases are likely to emerge in the future to support full-length protein research and innovation.
              </li>
            </ul>
            <div className="flex justify-center mb-8">
              <img
                alt="Hands holding pill"
                className="rounded max-w-full h-auto"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-ujyh002-ksWswXXnBcBlFAX-1J0nLMmzB7Y6E5pbm7wM1qzhTaQv95mUFF3Dhy9dDLuTZbXrlEdGwHUMZQhBspFUiAxT1lgsuykQmxQAMK6LgiKiQo_Bzcy9bpNm1lTSwuCoSVfrvPQibeFY85rXOV9d_wa1OWe3-vl99z4Dqg4IdeWZgewOKnnhEWl0ZQCzb6U0mNP7-bH62aY5_Jb2uETYFhXo-QAso41FiVEr6PPcEoVt0rjI"
              />
            </div>
          </section>
          <section className="mb-10" id="applications">
            <h2 className="text-2xl font-semibold text-teal border-b-2 border-teal pb-2 mb-4">Applications</h2>
            <ul className="list-disc pl-5 text-gray-700 leading-relaxed space-y-2">
              <li>
                <strong>Drug development:</strong>
                By preparing recombinant full-length proteins, it is possible to conduct drug-target protein interaction
                studies, understand the binding mechanism of the drug to the target, and evaluate the activity and
                specificity of the drug.
              </li>
              <li>
                <strong>Cell therapy:</strong>
                In the field of cell therapy, recombinant full-length proteins can be used to prepare therapeutic cell
                products, such as receptor proteins in CAR-T cell therapy for tumor immunotherapy.
              </li>
              <li>
                <strong>Vaccine development:</strong>
                By expressing recombinant full-length proteins, antigens for use in vaccines can be prepared to induce
                an immune response to protect humans from pathogens.
              </li>
            </ul>
          </section>
          <section className="mb-10" id="case-study">
            <h2 className="text-2xl font-semibold text-teal border-b-2 border-teal pb-2 mb-4">Case Study</h2>
            <div className="mb-8">
              <h3 className="font-bold text-gray-800 mb-2">Case Study 1: Recombinant Human EGF Protein</h3>
              <p className="text-gray-700 leading-relaxed text-sm mb-4">
                Re-education of the tumor microenvironment with immune checkpoint inhibitors (ICI) has provided the most
                significant advancement in cancer management, with impressive efficacy and durable response reported.
                However, low response rates and a high frequency of immune-related adverse events (irAEs) remain
                associated with ICI therapies. The latter can be linked to their high affinity and avidity for their
                target that fosters on-target/off-tumor binding and subsequent breaking of immune self-tolerance in
                normal tissues. Many multispecific protein formats have been proposed to increase the tumor cell's
                selectivity of ICI therapies.
                <br />
                In this study, the researchers explored the engineering of a bispecific Nanofitin by the fusion of an
                anti-epidermal growth factor receptor (EGFR) and anti-programmed cell death ligand 1 (PDL1) Nanofitin
                modules. While lowering the affinity of the Nanofitin modules for their respective target, the fusion
                enables the simultaneous engagement of EGFR and PDL1, which translates into a selective binding to tumor
                cells co-expressing EGFR and PDL1 only.
              </p>
              <div className="flex flex-col items-center">
                <img
                  alt="Fig1. EGFR phosphorylation level"
                  className="mb-2"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyAR3ahsmvqf76e874lcE1OsqEM9J2HPtX12N71m3mTpV1avmXQ1vhhsl7Bb9imkn6L1iII3bfoKszCA26AH_e-0woMLPXIO1acKjIhXPyaQEewX3PEw6xJ126ZpBl_rTVzpf7kQf89KIIAfa8ERZzgf21Hs2E-2N-2-8BSeCJ5RKHK1YkPbcMt5790xtZ2I2dTodBRd1e2xEly8KgdU0xYi8-HBsu194DhhQAJ2_ycK6-tTcCFddW"
                />
                <p className="text-xs text-gray-500 italic text-center">
                  (Perrine Jacquot, 2023)
                  <br />
                  Fig1. EGFR phosphorylation level in the presence or the absence of EGF, Cetuximab and B10 Nanofitin
                  studied by Western Blot on A431 cell line.
                </p>
              </div>
            </div>
          </section>
        </div>
        {/* 评论区 - 供测试滚动操作 */}
        <section data-section="reviews" className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">用户评价</h2>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gray-300" />
                  <span className="text-sm font-medium text-gray-700">用户 {i}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <ICONS.star key={s} size={12} className="text-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600">商品质量很好，物流也很快，推荐购买！这是第 {i} 条评价。</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* AI 助手 Widget 渲染区 */}
      {children}
    </div>
  );
};

export default MockHostPage;
