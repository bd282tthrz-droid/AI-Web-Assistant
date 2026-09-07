// 文件路径: src/utils/debug-log.ts
// 用途: 开发模式调试日志工具，提供带命名空间前缀的 logger 工厂
// 设计要点:
//   1. 通过 import.meta.env.DEV 开关控制，生产构建会被 Vite 静态消除
//   2. 工厂模式支持各模块创建独立前缀的 logger，便于 Console 筛选
//   3. 符合规范第 10 条（禁止保留 console.log）与第 3 条（工具函数放 utils）

type LogArgs = readonly unknown[];

// 基础日志输出函数（仅开发环境生效）
const logInDev = (method: "log" | "warn" | "error", prefix: string, args: LogArgs): void => {
  if (!import.meta.env.DEV) return;
  // eslint-disable-next-line no-console
  console[method](prefix, ...args);
};

// 创建带命名空间前缀的调试 logger
// 使用示例: const debugLog = createDebugLogger("[action-parser]");
export const createDebugLogger = (prefix: string) => ({
  log: (...args: LogArgs): void => logInDev("log", prefix, args),
  warn: (...args: LogArgs): void => logInDev("warn", prefix, args),
  error: (...args: LogArgs): void => logInDev("error", prefix, args)
});

// 日志 logger 类型（便于显式标注）
export type DebugLogger = ReturnType<typeof createDebugLogger>;
