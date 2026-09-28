// TanStack Query Provider
// 统一管理 API 请求的缓存/重试/状态

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, type FC } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,            // 30s 内不重新请求
      retry: 2,                      // 失败重试 2 次
      refetchOnWindowFocus: false,
    },
  },
});

export const QueryProvider: FC<{ children: ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);