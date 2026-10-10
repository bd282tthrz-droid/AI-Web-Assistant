import { extractPageContext } from "./page-context-extractor";
import { detectProduct } from "./product-detector";
import { getProfileSync } from "@/services/dify/user-profile-store";

// 上下文构建器
// 组装页面上下文数据，格式化为 Dify inputs 可理解的键值对

// 构建商品信息文本描述
const formatProductInfo = (product: {
  readonly name: string;
  readonly price: string;
  readonly sku: string;
  readonly availability: string;
  readonly found: boolean;
}): string => {
  if (!product.found) return "";

  const parts: string[] = [];
  if (product.name) parts.push(`name: ${product.name}`);
  if (product.price) parts.push(`price: ${product.price}`);
  if (product.sku) parts.push(`sku: ${product.sku}`);
  if (product.availability) parts.push(`availability: ${product.availability}`);

  return parts.join(" | ");
};

// 构建 Dify inputs 参数
// 所有值必须是 string 类型（Dify inputs 要求）
export const buildContextInputs = (): Record<string, string> => {
  const page = extractPageContext();
  const product = detectProduct();
  const profile = getProfileSync();

  return {
    page_title: page.pageTitle,
    page_url: page.pageUrl,
    page_content: page.pageContent,
    page_description: page.pageDescription,
    product_info: formatProductInfo(product),
    interactive_elements: page.interactiveElements,
    user_email: profile.email ?? "",
    user_name: profile.name ?? "",
    user_phone: profile.phone ?? ""
  };
};
