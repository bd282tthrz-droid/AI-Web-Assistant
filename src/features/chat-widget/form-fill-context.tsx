// 表单填充类型 Context
// 绕过 props 逐层透传，ChatWidget → ChatComposer 直连

import { createContext, useContext, type ReactNode, type FC } from "react";

const FormFillContext = createContext<string | null>(null);

export const FormFillProvider: FC<{ value: string | null; children: ReactNode }> = ({ value, children }) => (
  <FormFillContext.Provider value={value}>{children}</FormFillContext.Provider>
);

export const useFormFill = (): string | null => useContext(FormFillContext);