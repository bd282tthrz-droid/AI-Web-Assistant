import { z } from 'zod'

// Dify API 请求/响应 Zod Schema 定义
// 仅用于 Dify API 接口的运行时数据校验（外部数据）

// ============ 请求 Schema ============

// Dify chat-messages 请求体
export const DifyChatRequestSchema = z.object({
  query: z.string().min(1).describe('User message content'),
  inputs: z.record(z.string(), z.string()).default({}).describe('Custom variables'),
  response_mode: z.enum(['streaming', 'blocking']).default('streaming'),
  user: z.string().min(1).describe('User identifier'),
  conversation_id: z.string().optional().describe('Conversation ID for resuming'),
})

// ============ SSE 事件 Schema ============

// message 事件 - AI 回复文本片段
export const DifyMessageEventSchema = z.object({
  event: z.literal('message'),
  message_id: z.string(),
  conversation_id: z.string(),
  answer: z.string().describe('Current reply text fragment (streaming accumulation)'),
  created_at: z.number().optional(),
})

// message_end 事件 - 消息结束
export const DifyMessageEndEventSchema = z.object({
  event: z.literal('message_end'),
  message_id: z.string(),
  conversation_id: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// agent_thought 事件 - AI 思考过程
export const DifyAgentThoughtEventSchema = z.object({
  event: z.literal('agent_thought'),
  id: z.string().optional(),
  thought: z.string().optional().describe('Thought content'),
  observation: z.string().optional().describe('Observation result'),
  tool: z.string().optional().describe('Tool name'),
  tool_input: z.string().optional().describe('Tool input'),
  message_files: z.array(z.unknown()).optional(),
})

// error 事件 - 错误
export const DifyErrorEventSchema = z.object({
  event: z.literal('error'),
  code: z.string().optional(),
  message: z.string(),
  status: z.number().optional(),
})

// ping 事件 - 心跳
export const DifyPingEventSchema = z.object({
  event: z.literal('ping'),
})

// ============ ChatFlow 工作流事件 Schema ============
// 当 Dify 应用类型为 ChatFlow 时，SSE 流会额外下发工作流节点事件
// 前端识别这些事件以避免 safeParse 失败导致数据被丢弃

// workflow_started 事件 - 工作流开始
export const DifyWorkflowStartedEventSchema = z.object({
  event: z.literal('workflow_started'),
  conversation_id: z.string(),
  message_id: z.string(),
  created_at: z.number(),
  task_id: z.string(),
  workflow_run_id: z.string(),
  data: z.object({
    id: z.string(),
    workflow_id: z.string(),
    inputs: z.record(z.string(), z.unknown()),
    created_at: z.number(),
    reason: z.string().optional(),
  }),
})

// node_started 事件 - 节点开始
export const DifyNodeStartedEventSchema = z.object({
  event: z.literal('node_started'),
  conversation_id: z.string(),
  message_id: z.string(),
  created_at: z.number(),
  task_id: z.string(),
  workflow_run_id: z.string(),
  data: z.object({
    id: z.string(),
    node_id: z.string(),
    node_type: z.string(),
    title: z.string(),
    index: z.number(),
    predecessor_node_id: z.string().nullable(),
    inputs: z.unknown().nullable(),
    inputs_truncated: z.boolean(),
    created_at: z.number(),
    extras: z.record(z.string(), z.unknown()),
    iteration_id: z.string().nullable(),
    loop_id: z.string().nullable(),
    agent_strategy: z.string().nullable(),
  }),
})

// node_finished 事件 - 节点结束
export const DifyNodeFinishedEventSchema = z.object({
  event: z.literal('node_finished'),
  conversation_id: z.string(),
  message_id: z.string(),
  created_at: z.number(),
  task_id: z.string(),
  workflow_run_id: z.string(),
  data: z.object({
    id: z.string(),
    node_id: z.string(),
    node_type: z.string(),
    title: z.string(),
    index: z.number(),
    predecessor_node_id: z.string().nullable(),
    inputs: z.record(z.string(), z.unknown()),
    inputs_truncated: z.boolean(),
    process_data: z.record(z.string(), z.unknown()),
    process_data_truncated: z.boolean(),
    outputs: z.record(z.string(), z.unknown()),
    outputs_truncated: z.boolean(),
    status: z.string(),
    error: z.string().nullable(),
    elapsed_time: z.number(),
    execution_metadata: z.unknown().nullable(),
    created_at: z.number(),
    finished_at: z.number(),
    files: z.array(z.unknown()),
    iteration_id: z.string().nullable(),
    loop_id: z.string().nullable(),
  }),
})

// workflow_finished 事件 - 工作流结束
// data.outputs 包含工作流最终输出（answer 字段），可用于兜底校验
export const DifyWorkflowFinishedEventSchema = z.object({
  event: z.literal('workflow_finished'),
  conversation_id: z.string(),
  message_id: z.string(),
  created_at: z.number(),
  task_id: z.string(),
  workflow_run_id: z.string(),
  data: z.object({
    id: z.string(),
    workflow_id: z.string(),
    status: z.string(),
    outputs: z.record(z.string(), z.unknown()),
    error: z.string().nullable(),
    elapsed_time: z.number(),
    total_tokens: z.number(),
    total_steps: z.number(),
    created_by: z.object({
      id: z.string(),
      user: z.string(),
    }),
    created_at: z.number(),
    finished_at: z.number(),
    exceptions_count: z.number(),
    files: z.array(z.unknown()),
  }),
})

// SSE 事件联合类型（运行时解析时使用）
export const DifyStreamEventSchema = z.union([
  DifyMessageEventSchema,
  DifyMessageEndEventSchema,
  DifyAgentThoughtEventSchema,
  DifyErrorEventSchema,
  DifyPingEventSchema,
  DifyWorkflowStartedEventSchema,
  DifyNodeStartedEventSchema,
  DifyNodeFinishedEventSchema,
  DifyWorkflowFinishedEventSchema,
])

// ============ 推导类型 ============

export type DifyChatRequest = z.infer<typeof DifyChatRequestSchema>
export type DifyMessageEvent = z.infer<typeof DifyMessageEventSchema>
export type DifyMessageEndEvent = z.infer<typeof DifyMessageEndEventSchema>
export type DifyAgentThoughtEvent = z.infer<typeof DifyAgentThoughtEventSchema>
export type DifyErrorEvent = z.infer<typeof DifyErrorEventSchema>
export type DifyWorkflowStartedEvent = z.infer<typeof DifyWorkflowStartedEventSchema>
export type DifyNodeStartedEvent = z.infer<typeof DifyNodeStartedEventSchema>
export type DifyNodeFinishedEvent = z.infer<typeof DifyNodeFinishedEventSchema>
export type DifyWorkflowFinishedEvent = z.infer<typeof DifyWorkflowFinishedEventSchema>
export type DifyStreamEvent = z.infer<typeof DifyStreamEventSchema>
