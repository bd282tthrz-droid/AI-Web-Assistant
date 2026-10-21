// 询价表单读取模块
// 不猜测 CSS 选择器，直接遍历并读取页面表单内输入元素的真实特征（label/name/placeholder/aria/type），
// 基于读取到的特征分类字段类型，供页面总结卡片的 Fill inquiry form 使用。

export type FieldKind = "email" | "name" | "phone";

// 读取到的单个字段信息（真实特征拼接 + 空值判断）
export interface FormFieldInfo {
  readonly element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  // type/name/id/placeholder/aria-label/label 文本 的真实拼接（小写）
  readonly text: string;
  readonly empty: boolean;
}

// 字段类别 → 特征关键词（匹配 info.text）
const KIND_KEYWORDS: Record<FieldKind, readonly string[]> = {
  email: ["email", "mail"],
  phone: ["tel", "phone", "mobile"],
  name: ["full name", "fullname", "your name", "contact name", "name"],
};

// 元素是否可见（隐藏元素不参与读取与填充）
const isVisible = (el: HTMLElement): boolean => {
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

// 读取一个输入元素的真实特征文本（小写拼接）
const readFieldText = (el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string => {
  const labels = Array.from(el.labels ?? [])
    .map((l) => l.textContent ?? "")
    .join(" ");
  // select 无 placeholder，input/textarea 才读取
  const placeholder = "placeholder" in el ? el.placeholder : "";
  const parts = [
    el.type,
    el.name,
    el.id,
    placeholder,
    el.getAttribute("aria-label"),
    labels,
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
};

// 读取表单内所有可见输入元素及其真实特征
export const readFormFields = (form: HTMLFormElement): FormFieldInfo[] => {
  const candidates = Array.from(
    form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select")
  );
  return candidates
    .filter((el) => isVisible(el))
    .map((el) => ({
      element: el,
      text: readFieldText(el),
      empty: !(el as HTMLInputElement).value?.trim(),
    }));
};

// 基于读取到的真实特征分类字段类型
export const classifyField = (info: FormFieldInfo): FieldKind | null => {
  // 关键词存在性判断按优先级：email（含"mail"）→ phone → name（"name" 最宽泛，放最后）
  if (KIND_KEYWORDS.email.some((k) => info.text.includes(k))) return "email";
  if (KIND_KEYWORDS.phone.some((k) => info.text.includes(k))) return "phone";
  if (KIND_KEYWORDS.name.some((k) => info.text.includes(k))) return "name";
  return null;
};

// 查找页面询价表单：读取页面表单，存在含 email 字段的表单则返回，无则 null
export const findInquiryForm = (): HTMLFormElement | null => {
  for (const form of document.querySelectorAll<HTMLFormElement>("form")) {
    if (readFormFields(form).some((info) => classifyField(info) === "email")) return form;
  }
  return null;
};

// 页面第一个可见表单（定位兜底：无含 email 询价表单时仍能定位到表单位置）
export const findVisibleForm = (): HTMLFormElement | null => {
  for (const form of document.querySelectorAll<HTMLFormElement>("form")) {
    if (isVisible(form)) return form;
  }
  return null;
};

// 在表单内查找指定类别且为空的字段（无匹配或已有值则返回 null）
export const findEmptyField = (form: HTMLFormElement, kind: FieldKind): FormFieldInfo | null => {
  for (const info of readFormFields(form)) {
    if (info.empty && classifyField(info) === kind) return info;
  }
  return null;
};