// 后端服务模式配置
// 支持 dify（云端，旧版手写SSE）、dify-sdk（云端，AI SDK版）、local（本地Agent接口）切换

// 后端模式类型
type BackendMode = 'dify' | 'dify-sdk' | 'local'

// 后端配置结构（内部类型，用 TS 原生）
interface BackendConfigType {
  /** 当前后端模式 */
  readonly mode: BackendMode
  /** 本地 Agent 接口地址 */
  readonly localApiUrl: string
}

// 从 Vite 环境变量读取配置，默认使用 dify
export const BACKEND_CONFIG: BackendConfigType = {
  mode: (import.meta.env.VITE_ASSISTANT_BACKEND ?? 'dify') as BackendMode,
  localApiUrl:
    import.meta.env.VITE_LOCAL_API_URL ?? 'http://localhost:5688/api/ai/chat/stream',
}

// 是否当前为本地模式
export const isLocalMode = (): boolean => BACKEND_CONFIG.mode === 'local'

// 是否当前为 Dify 模式
export const isDifyMode = (): boolean => BACKEND_CONFIG.mode === 'dify'

// 是否当前为 Dify AI SDK 模式
export const isDifySDKMode = (): boolean => BACKEND_CONFIG.mode === 'dify-sdk'
