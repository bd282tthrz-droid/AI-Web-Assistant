import { createDifyProvider } from "dify-ai-provider";
import { DIFY_CONFIG } from "@/constants/api";
import { createDebugLogger } from "@/utils/debug-log";
import { wfError } from "../dify-error-state";
import { useNodeProgress } from "../node-progress-store";

// 从 DIFY_CHAT_MESSAGES 端点 URL 提取 base URL（与旧代码使用同一端点）
const DIFY_BASE_URL = DIFY_CONFIG.BASE_URL;
const debugLog = createDebugLogger("[dify-chat-transport]");

// 创建 provider 时指定正确的 base URL，避免默认值 https://api.dify.ai/v1 导致 401
// 使用自定义 fetch 拦截 SSE 流：将 node_started.title 注入为 message 事件，显示工作流节点进度
// 注意：依赖 patches/dify-ai-provider+1.1.1.patch 修复 fetch 参数传递 bug
export const difyProvider = createDifyProvider({
  baseURL: DIFY_BASE_URL,
  fetch: async (url, init) => {
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (err) {
      // 用户主动取消（AbortError）不处理，让上游正常关闭
      if (err instanceof Error && err.name === "AbortError") throw err;
      // 网络错误（CORS、DNS、连接拒绝等），fetch 无 response 对象
      debugLog.log("fetch error:", err);
      const msg = err instanceof TypeError ? `Network error: ${err.message}` : `Request failed: ${err}`;
      wfError.set(msg);
      throw err;
    }
    // 捕获 HTTP 错误（401/500 等），触发错误卡片
    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      wfError.set(`Dify API error (${response.status}): ${errBody.slice(0, 200)}`);
    }
    if (!response.body) return response;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = "";

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              useNodeProgress.getState().complete();
              if (buffer.trim()) controller.enqueue(encoder.encode(buffer));
              controller.close();
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (line.startsWith("data:")) {
                try {
                  const evt = JSON.parse(line.slice(5).trim());
                  debugLog.log("[node_started]", evt.data?.title);
                  if (evt.event === "node_started" && evt.data?.title) {
                    useNodeProgress.getState().addNode(evt.data.title);
                  }
                  // 工作流完成/失败时标记节点完成
                  if (evt.event === "workflow_finished") {
                    useNodeProgress.getState().complete();
                    if (evt.data?.status === "failed") {
                      const fake = JSON.stringify({
                        event: "message",
                        answer: `❌ [SSE_002] ${evt.data.error ?? "Workflow failed"}\n`,
                        conversation_id: evt.conversation_id ?? ""
                      });
                      controller.enqueue(encoder.encode(`data: ${fake}\n\n`));
                      wfError.set(evt.data.error ?? "Workflow execution failed");
                      debugLog.log("[workflow_failed]", evt.data.error);
                    }
                  }
                } catch {
                  /* ignore parse errors */
                }
              }
              controller.enqueue(encoder.encode(line + "\n"));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          reader.releaseLock();
        }
      }
    });

    return new Response(readable, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }
});
