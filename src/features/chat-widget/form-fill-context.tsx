// 表单填充类型 Context
// 绕过 props 逐层透传，ChatWidget → ChatComposer 直连
// label: 表单类型（search / form）
// seq: 每次点击自动填写按钮递增的触发序号（保证重复点击同类型也能触发 effect）

import { createContext, useContext, type ReactNode, type FC } from "react";

interface FormFillValue {
  label: string | null;
  seq: number;
}

const FormFillContext = createContext<FormFillValue>({ label: null, seq: 0 });

export const FormFillProvider: FC<{ value: FormFillValue; children: ReactNode }> = ({ value, children }) => (
  <FormFillContext.Provider value={value}>{children}</FormFillContext.Provider>
);

export const useFormFill = (): FormFillValue => useContext(FormFillContext);