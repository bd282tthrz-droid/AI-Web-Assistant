import { defineToolkit } from "@assistant-ui/react";
import { z } from "zod";
import { executeAction } from "./action-executor";
import type { ActionResult } from "./action-types";
import ConfirmToolUI from "@/features/chat-widget/tool-ui/confirm-tool-ui";
import FrontendToolUI from "@/features/chat-widget/tool-ui/frontend-tool-ui";
// Assistant UI 官方工具注册
// human tool（需要用户确认）：click_element, navigate_to
// frontend tool（自动执行）：fill_input, scroll_to, highlight_element
// 复用现有 executeAction 执行器，避免重复实现 DOM 操作逻辑

// 通用参数 schema（与 4 维元素定位策略对齐：data_attributes / anchor_context / text_match / css_selector）
const anchorContextSchema = z.object({
  anchorText: z.string(),
  targetSelector: z.string(),
});

// 兼容 Dify 返回空字符串的情况：anchor_context 可能是 "" 或 { anchorText, targetSelector }
const anchorContextCompat = z.union([anchorContextSchema, z.string(), z.literal("")]);

const elementArgsSchema = z.object({
  data_attributes: z.string().optional(),
  anchor_context: anchorContextCompat.optional(),
  text_match: z.string().optional(),
  css_selector: z.string().optional(),
});

const toolkit = defineToolkit({
  // human tool：点击元素，需要用户确认
  // 说明：assistant-ui 类型系统强制：type: "human" 的工具不允许定义 execute 字段
  // runtime 也不会自动调用 human 工具的 execute
  // 实际 DOM 操作由 ConfirmToolUI 在用户确认后主动调用 executeAction 触发
  click_element: {
    type: "human",
    description: "Click on a page element, such as add-to-cart button, navigation link, etc.",
    parameters: elementArgsSchema,
    render: ConfirmToolUI
  },

  // human tool：页面跳转，需要用户确认
  // 说明：同上，execute 由 ConfirmToolUI 主动调用，runtime 不触发
  navigate_to: {
    type: "human",
    description: "Navigate to the specified URL",
    parameters: z.object({
      url: z.string()
    }),
    render: ConfirmToolUI
  },

  // frontend tool：填充输入框，自动执行
  fill_input: {
    type: "frontend",
    description: "Fill content into an input field, such as search box, form field, etc. Auto-presses Enter after filling to trigger search/submit.",
    parameters: elementArgsSchema.extend({
      value: z.string()
    }),
    execute: async (args): Promise<ActionResult> =>
      executeAction({
        tool: "fill_input",
        params: {
          data_attributes: args.data_attributes,
          anchor_context: args.anchor_context,
          text_match: args.text_match,
          css_selector: args.css_selector,
          value: args.value
        }
      }),
    render: FrontendToolUI
  },

  // frontend tool：滚动页面，自动执行
  scroll_to: {
    type: "frontend",
    description: "Scroll the page to a specified element or position",
    parameters: elementArgsSchema.extend({
      position: z.enum(["top", "bottom"]).optional()
    }),
    execute: async (args): Promise<ActionResult> =>
      executeAction({
        tool: "scroll_to",
        params: {
          data_attributes: args.data_attributes,
          anchor_context: args.anchor_context,
          text_match: args.text_match,
          css_selector: args.css_selector,
          position: args.position
        }
      }),
    render: FrontendToolUI
  },

  // frontend tool：高亮元素，自动执行
  highlight_element: {
    type: "frontend",
    description: "Highlight a page element to draw user attention",
    parameters: elementArgsSchema,
    execute: async (args): Promise<ActionResult> =>
      executeAction({
        tool: "highlight_element",
        params: {
          data_attributes: args.data_attributes,
          anchor_context: args.anchor_context,
          text_match: args.text_match,
          css_selector: args.css_selector
        }
      }),
    render: FrontendToolUI
  }
});

// 需要用户确认的工具列表（传入 unstable_humanToolNames）
export const HUMAN_TOOL_NAMES = ["click_element", "navigate_to"] as const;

export { toolkit };
