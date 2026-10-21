// 统一"自动填写表单"入口
// 定位表单位置（含 email 询价表单优先，兜底任一可见表单）→ 滚动高亮 → 填充用户信息（读真实元素）
// 供页面总结卡片的 Fill inquiry form 及其他入口（Auto-fill 等）复用同一个填表实现

import { findInquiryForm, findVisibleForm, findEmptyField, type FieldKind } from "./inquiry-form";
import { executeHighlight } from "@/features/action-executor/actions/highlight-action";
import { executeFillField } from "@/features/action-executor/actions/fill-field-action";
import { animateFill } from "@/features/action-executor/form-actions/field-animator";
import type { UserProfile } from "@/services/dify/user-profile-store";

export interface FieldFillDetail {
  readonly kind: FieldKind;
  readonly status: "filled" | "field-missing" | "failed";
  readonly error?: string;
}

export interface AutoFillResult {
  readonly located: boolean; // 是否定位到表单
  readonly form: HTMLFormElement | null;
  readonly fieldsFilled: number;
  readonly details: readonly FieldFillDetail[];
}

// 自动填写表单：定位优先（无论能否填充都先滚动高亮到表单位置），再尝试填充用户信息
export const autoFillInquiryForm = async (profile: UserProfile): Promise<AutoFillResult> => {
  // ① 定位：含 email 询价表单优先，兜底页面任一可见表单
  const form = findInquiryForm() ?? findVisibleForm();
  if (!form) {
    return { located: false, form: null, fieldsFilled: 0, details: [] };
  }

  // ② 滚动 + 高亮（复用 highlight-action）
  await executeHighlight({ element: form });

  // ③ 逐字段填充：读取表单内真实元素，有用户信息且字段为空才填
  const attempts: Array<[FieldKind, string]> = [
    ["email", profile.email ?? ""],
    ["name", profile.name ?? ""],
    ["phone", profile.phone ?? ""],
  ];
  const details: FieldFillDetail[] = [];
  for (const [kind, value] of attempts) {
    if (!value) continue;
    const target = findEmptyField(form, kind);
    if (!target) {
      details.push({ kind, status: "field-missing" });
      continue;
    }
    const result = await executeFillField({ element: target.element, value });
    if (!result.success) {
      details.push({ kind, status: "failed", error: result.error ?? result.message });
      continue;
    }
    await animateFill(target.element);
    details.push({ kind, status: "filled" });
  }

  return {
    located: true,
    form,
    fieldsFilled: details.filter((d) => d.status === "filled").length,
    details,
  };
};