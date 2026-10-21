// 页面总结 Inline 询价卡片
// 渲染在"页面总结"回复消息底部：显示页面标题 / email / name + Skip / Fill inquiry form
// 数据本地即时获取（页面上下文 + 用户 profile），不依赖 Dify 返回
// Fill 复用既有执行体系，字段基于读取页面真实元素（inquiry-form），非猜测选择器

import { useState, type FC } from "react";
import { Button } from "@heroui/react";
import { Ripple } from "m3-ripple";
import { extractPageContext } from "@/features/page-context/page-context-extractor";
import { autoFillInquiryForm } from "@/features/page-context/auto-fill";
import { getProfileSync } from "@/services/dify/user-profile-store";
import { createDebugLogger } from "@/utils/debug-log";

const debugLog = createDebugLogger("[page-summary-card]");

const PageSummaryCard: FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const [filling, setFilling] = useState(false);

  if (dismissed) return null;

  const { pageTitle } = extractPageContext();
  const { email, name } = getProfileSync();

  const handleFill = async () => {
    setFilling(true);
    // 统一自动填写入口：先定位表单位置（滚动 + 高亮），再尝试填充用户信息
    const result = await autoFillInquiryForm(getProfileSync());
    debugLog.log("[handleFill] auto-fill result:", result);
    setFilling(false);
  };

  const rowClass = "flex items-center justify-between gap-3";
  const valueClass = "truncate text-right text-sm text-[#F5D2AF]";
  const labelClass = "shrink-0 text-xs text-[#F5D2AF]/60";

  return (
    <div className="mt-3 rounded-xl border border-[#F5D2AF]/30 bg-[#3C5F32]/95 p-4 shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-2 text-sm font-medium text-[#F5D2AF]">
        <span>💬</span> Inquiry details
      </div>
      <div className="mt-2 space-y-1.5">
        <div className={rowClass}>
          <span className={labelClass}>Page title</span>
          <span className={valueClass}>{pageTitle || "—"}</span>
        </div>
        <div className={rowClass}>
          <span className={labelClass}>Email</span>
          <span className={valueClass}>{email || "—"}</span>
        </div>
        <div className={rowClass}>
          <span className={labelClass}>Name</span>
          <span className={valueClass}>{name || "—"}</span>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button size="sm" variant="ghost" onPress={() => setDismissed(true)} className="text-[#F5D2AF]/60 hover:text-[#FF641E]/90">
          Skip
          <Ripple />
        </Button>
        <Button size="sm" onPress={handleFill} isDisabled={filling} className="bg-[#FF641E] text-white hover:bg-[#FF641E]/90 disabled:opacity-40">
          {filling ? (
            "Filling..."
          ) : (
            <>
              Fill inquiry form
              <Ripple />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PageSummaryCard;