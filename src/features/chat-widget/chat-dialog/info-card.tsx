import { motion, AnimatePresence } from "framer-motion";
import { useState, type FC } from "react";
import { Button, TextField, Input, FieldError } from "@heroui/react";
import { Ripple } from "m3-ripple";
import { useUserProfile } from "@/services/dify/user-profile-store";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface InfoCardProps {
  readonly onDone: () => void;
}

const InfoCard: FC<InfoCardProps> = ({ onDone }) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const setField = useUserProfile((s) => s.setField);

  const handleSave = () => {
    // 以 validate 同一套规则守卫提交，非法 email 不放行（FieldError 已展示错误）
    const emailVal = email.trim();
    if (emailVal && !EMAIL_REGEX.test(emailVal)) return;
    if (emailVal) setField("email", emailVal);
    if (name.trim()) setField("name", name.trim());
    onDone();
  };

  return (
    <AnimatePresence>
      {/* 遮罩层 */}
      <motion.div
        className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onDone}>
        {/* 弹窗卡片 — 阻止冒泡避免点击卡片内部触发关闭 */}
        <motion.div
          className="mx-4 w-full max-w-xs rounded-xl border border-[#F5D2AF]/30 bg-[#3C5F32]/95 p-5 shadow-2xl backdrop-blur-md"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 text-sm font-medium text-[#F5D2AF]">
            <span>💾</span> Save your chat history
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#F5D2AF]/60">Your conversations will be saved so you can continue where you left off next time.</p>
          <TextField
            type="email"
            value={email}
            onChange={setEmail}
            isRequired
            validationBehavior="aria"
            validate={(value) => {
              const v = value.trim();
              if (!v) return undefined; // 可选：留空不报错
              return EMAIL_REGEX.test(v) ? true : "Please enter a valid email address";
            }}
            className="mt-4 block text-[#F5D2AF]">
            <Input
              placeholder="Email address"
              variant="primary"
              className="w-full border border-[#F5D2AF]/40 bg-[#3C5F32] px-3 py-2 text-sm text-[#F5D2AF] outline-none placeholder:text-[#F5D2AF]/40"
            />
            <FieldError className="text-[#FF641E]" />
          </TextField>
          <TextField type="text" value={name} onChange={setName} className="mt-3 block text-[#F5D2AF]">
            <Input
              placeholder="Your name (so I can call you)"
              className="w-full border border-[#F5D2AF]/40 bg-[#3C5F32] px-3 py-2 text-sm text-[#F5D2AF] outline-none placeholder:text-[#F5D2AF]/40"
            />
          </TextField>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onPress={onDone} className="text-[#F5D2AF]/60 hover:text-[#FF641E]/90">
              Skip
              <Ripple />
            </Button>
            <Button size="sm" onPress={handleSave} isDisabled={!email.trim()} className="bg-[#FF641E] text-white hover:bg-[#FF641E]/90 disabled:opacity-40">
              Save
              <Ripple />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InfoCard;
