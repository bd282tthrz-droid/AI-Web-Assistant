// API 客户端工厂
// 基于 ky 的企业级 HTTP 客户端工厂，统一超时/重试/错误处理
// 不同后端（Dify、其他第三方）通过 createApiClient 各自创建实例

import ky from "ky";

interface ApiClientOptions {
  readonly prefix?: string;
  readonly apiKey?: string;
  readonly name?: string;
}

// 创建 API 客户端实例
export const createApiClient = (options: ApiClientOptions) => {
  const tag = options.name ?? "API";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.apiKey) {
    headers.Authorization = `Bearer ${options.apiKey}`;
  }

  return ky.create({
    prefix: options.prefix,
    timeout: 30000,
    retry: {
      limit: 2,
      methods: ["get"],
      statusCodes: [408, 429, 500, 502, 503, 504],
    },
    hooks: {
      beforeError: [
        (state) => {
          state.error.message = `[${tag}] ${state.error.message}`;
          return state.error;
        },
      ],
    },
    headers,
  });
};