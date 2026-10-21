// 页面总结功能集中常量
// 悬停正文 → "Summarize page" 浮标 → 自动请求 Dify 总结 → 消息底部渲染 Inline 询价卡片

// 正文悬停检测选择器（避免与 FormHint 的 input/textarea 冲突）
export const PAGE_TEXT_SELECTORS =
  "p, h1, h2, h3, h4, h5, h6, article, li, blockquote, td, figcaption, summary, dd, dt";

// 发送给 Dify 的页面总结 prompt（页面上下文已通过 buildDifyInputs 自动注入）
export const SUMMARY_PROMPT =
  "Please analyze and summarize the current page for me. Include what this page is about, its main purpose, key sections, and important details.";

// 消息类型标记：用户请求消息携带（metadata.custom.type）
export const MESSAGE_TYPE_PAGE_SUMMARY = "page-summary";
// 回复消息标记：transport 检测到总结请求后注入（metadata.custom.pageSummary）
export const METADATA_PAGE_SUMMARY = "pageSummary";