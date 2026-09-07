// 全局配置常量
// 使用 as const 对象替代 enum（erasableSyntaxOnly 不允许 enum 语法）

export const CONFIG = {
  TARGET: "http://localhost:5688"
} as const;

// 推导字面量联合类型，便于按字段约束使用
export type ConfigKey = keyof typeof CONFIG;
