import { z } from "zod";

// ai-sdk Data Stream 协议 Zod Schema
// 参考: https://v5.ai-sdk.dev/docs/ai-sdk-ui/stream-protocol
// 仅用于本地后端 Agent 接口的运行时数据校验（外部数据）

// ============ 文本类事件 ============

// 消息开始
export const StreamStartSchema = z.object({
  type: z.literal("start"),
  messageId: z.string().optional()
});

// 文本块开始
export const TextStartSchema = z.object({
  type: z.literal("text-start"),
  id: z.string()
});

// 文本增量（核心：累加显示）
export const TextDeltaSchema = z.object({
  type: z.literal("text-delta"),
  id: z.string(),
  delta: z.string()
});

// 文本块结束
export const TextEndSchema = z.object({
  type: z.literal("text-end"),
  id: z.string()
});

// ============ 推理类事件 ============

export const ReasoningStartSchema = z.object({
  type: z.literal("reasoning-start"),
  id: z.string()
});

export const ReasoningDeltaSchema = z.object({
  type: z.literal("reasoning-delta"),
  id: z.string(),
  delta: z.string()
});

export const ReasoningEndSchema = z.object({
  type: z.literal("reasoning-end"),
  id: z.string()
});

// ============ 工具类事件（核心：前端执行 DOM 操作） ============

// 工具输入开始
export const ToolInputStartSchema = z.object({
  type: z.literal("tool-input-start"),
  toolCallId: z.string(),
  toolName: z.string()
});

// 工具输入增量
export const ToolInputDeltaSchema = z.object({
  type: z.literal("tool-input-delta"),
  toolCallId: z.string(),
  inputTextDelta: z.string()
});

// 工具输入完成（关键：触发前端执行 DOM 操作）
export const ToolInputAvailableSchema = z.object({
  type: z.literal("tool-input-available"),
  toolCallId: z.string(),
  toolName: z.string(),
  input: z.record(z.string(), z.unknown())
});

// 工具输出结果（后端推送的执行结果，前端模式下用于显示）
export const ToolOutputAvailableSchema = z.object({
  type: z.literal("tool-output-available"),
  toolCallId: z.string(),
  output: z.unknown()
});

// ============ 控制类事件 ============

// 步骤开始
export const StartStepSchema = z.object({
  type: z.literal("start-step")
});

// 步骤结束
export const FinishStepSchema = z.object({
  type: z.literal("finish-step")
});

// 消息结束
export const FinishSchema = z.object({
  type: z.literal("finish")
});

// 错误
export const StreamErrorSchema = z.object({
  type: z.literal("error"),
  errorText: z.string()
});

// ============ 联合类型 ============

export const DataStreamEventSchema = z.union([
  StreamStartSchema,
  TextStartSchema,
  TextDeltaSchema,
  TextEndSchema,
  ReasoningStartSchema,
  ReasoningDeltaSchema,
  ReasoningEndSchema,
  ToolInputStartSchema,
  ToolInputDeltaSchema,
  ToolInputAvailableSchema,
  ToolOutputAvailableSchema,
  StartStepSchema,
  FinishStepSchema,
  FinishSchema,
  StreamErrorSchema
]);

// 推导类型
export type DataStreamEvent = z.infer<typeof DataStreamEventSchema>;
export type ToolInputAvailable = z.infer<typeof ToolInputAvailableSchema>;
