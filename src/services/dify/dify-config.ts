// Dify 连接配置
// API Key 通过环境变量注入，禁止硬编码

interface DifyConfigType {
  /** Dify 应用 API Key（app-xxx 格式） */
  readonly apiKey: string;
  /** Dify 应用 ID */
  readonly appId: string;
  /** Dify API 基础 URL */
  readonly baseUrl: string;
}

// 从 Vite 环境变量读取配置
export const DIFY_CONFIG: DifyConfigType = {
  apiKey: import.meta.env.VITE_DIFY_API_KEY ?? "",
  appId: import.meta.env.VITE_DIFY_APP_ID ?? "",
  baseUrl: "https://dify.app.hicloudapp.com/v1"
};

// 校验配置是否完整（运行时检查）
export const validateDifyConfig = (): boolean => {
  if (!DIFY_CONFIG.apiKey) {
    throw new Error("Dify API Key not configured. Set VITE_DIFY_API_KEY in .env.local");
  }
  if (!DIFY_CONFIG.appId) {
    throw new Error("Dify App ID not configured. Set VITE_DIFY_APP_ID in .env.local");
  }
  return true;
};
