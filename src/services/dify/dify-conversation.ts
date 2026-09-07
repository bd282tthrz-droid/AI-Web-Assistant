// Dify 会话管理
// sessionStorage 存当前 Tab 会话，localStorage 存历史会话列表

const CONVERSATION_ID_KEY = "ai-assist-conversation-id";
const SESSION_ID_KEY = "ai-assist-session-id";
const HISTORY_KEY = "ai-assist-history";
const MAX_HISTORY = 50;

// 历史会话记录结构（内部类型，非外部数据，用 TS 原生类型）
interface ConversationHistoryItem {
  readonly conversationId: string;
  readonly lastMessage: string;
  readonly timestamp: number;
}

// ============ 当前 Tab 会话管理（sessionStorage） ============

// 获取当前会话 ID
export const getConversationId = (): string | null => {
  try {
    return sessionStorage.getItem(CONVERSATION_ID_KEY);
  } catch {
    // sessionStorage 不可用时降级返回 null
    return null;
  }
};

// 保存当前会话 ID
export const setConversationId = (conversationId: string): void => {
  try {
    sessionStorage.setItem(CONVERSATION_ID_KEY, conversationId);
  } catch {
    // 隐私模式或存储已满，静默失败
  }
};

// 获取或生成 Tab 级唯一会话标识
export const getSessionId = (): string => {
  try {
    const existing = sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;

    const sessionId = `anonymous_${crypto.randomUUID()}`;
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    return sessionId;
  } catch {
    // 降级：使用时间戳生成
    return `anonymous_${Date.now()}`;
  }
};

// 清空当前会话
export const clearCurrentSession = (): void => {
  try {
    sessionStorage.removeItem(CONVERSATION_ID_KEY);
  } catch {
    // 静默失败
  }
};

// ============ 历史会话管理（localStorage） ============

// 读取历史会话列表
const loadHistory = (): ConversationHistoryItem[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ConversationHistoryItem[]) : [];
  } catch {
    return [];
  }
};

// 保存到历史列表（最新在前，最多保留 MAX_HISTORY 条）
export const saveToHistory = (conversationId: string, lastMessage: string): void => {
  try {
    const history = loadHistory();
    const newItem: ConversationHistoryItem = {
      conversationId,
      lastMessage,
      timestamp: Date.now()
    };
    // 去重：移除同 ID 旧记录
    const filtered = history.filter((item) => item.conversationId !== conversationId);
    filtered.unshift(newItem);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, MAX_HISTORY)));
  } catch {
    // 存储已满或不可用，静默失败
  }
};

// 获取历史会话列表
export const getHistory = (): ConversationHistoryItem[] => {
  return loadHistory();
};

// 清空全部历史
export const clearHistory = (): void => {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // 静默失败
  }
};

// ============ 工具执行结果管理 ============

const ACTION_RESULT_KEY = "ai-assist-last-action-result";

// 保存上一轮工具执行结果（用于 Dify inputs.action_result）
export const setLastActionResult = (result: string): void => {
  try {
    sessionStorage.setItem(ACTION_RESULT_KEY, result);
  } catch {
    // 静默失败
  }
};

// 获取上一轮工具执行结果
export const getLastActionResult = (): string => {
  try {
    return sessionStorage.getItem(ACTION_RESULT_KEY) ?? "";
  } catch {
    return "";
  }
};

// 检查是否存在未消耗的工具执行结果（不删除，只查看）
export const peekLastActionResult = (): boolean => {
  try {
    return sessionStorage.getItem(ACTION_RESULT_KEY) !== null;
  } catch {
    return false;
  }
};

// 读取并消耗上一轮工具执行结果（读取后立即清除，防止跨轮次携带过期数据）
export const consumeLastActionResult = (): string => {
  try {
    const result = sessionStorage.getItem(ACTION_RESULT_KEY) ?? "";
    sessionStorage.removeItem(ACTION_RESULT_KEY);
    return result;
  } catch {
    return "";
  }
};
