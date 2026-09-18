// 模块级工作流错误状态（单例，仅当前 Tab 有效）
type ErrorListener = (error: string | null) => void;

let _lastError: string | null = null;
const _listeners = new Set<ErrorListener>();

export const wfError = {
  get last(): string | null {
    return _lastError;
  },
  set(error: string | null) {
    _lastError = error;
    _listeners.forEach((fn) => fn(error));
  },
  subscribe(fn: ErrorListener) {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
};