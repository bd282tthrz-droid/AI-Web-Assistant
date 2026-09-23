// 后端服务配置

// 后端配置结构（内部类型，用 TS 原生）
interface BackendConfigType {
  /** 本地 Agent 接口地址 */
  readonly localApiUrl: string
}

// 从 Vite 环境变量读取配置
export const BACKEND_CONFIG: BackendConfigType = {
  localApiUrl:
    import.meta.env.VITE_LOCAL_API_URL ?? 'http://localhost:5688/api/ai/chat/stream',
}