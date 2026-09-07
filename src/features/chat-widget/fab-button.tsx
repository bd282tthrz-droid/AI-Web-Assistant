import { Button } from "@heroui/react";
import { Ripple } from "m3-ripple";
import { ICONS } from "@/constants/icon";
import type { FC } from "react";

// FAB 浮动按钮 Props（内部 UI 类型，用 TS 原生）
interface FabButtonProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
}

// 浮动操作按钮 - 点击打开/关闭聊天对话框
// 固定定位在右下角，z-index 最高确保不被遮挡
const FabButton: FC<FabButtonProps> = ({ isOpen, onToggle }) => {
  return (
    <Button
      isIconOnly
      variant="primary"
      onPress={onToggle}
      aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      className="fixed bottom-6 right-6 z-[2147483647] h-14 w-14 rounded-full bg-[#FF641E] text-white shadow-lg shadow-[#FF641E]/30 transition-transform hover:scale-105 hover:bg-[#FF641E]/90">
      {isOpen ? <ICONS.close size={24} /> : <ICONS.wandMagic size={24} />}
      {/*   <Ripple /> */}
    </Button>
  );
};

export default FabButton;
