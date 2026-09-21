import { useState, useEffect, type FC } from "react";
import { ErrorPrimitive } from "@assistant-ui/react";
import { wfError } from "@/services/dify/dify-error-state";

const ErrorPanel: FC = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = wfError.subscribe(setError);
    return () => {
      unsub();
    };
  }, []);

  if (!error) return null;

  return (
    <ErrorPrimitive.Root className="mb-3 rounded-lg border border-[#FF641E]/30 bg-[#FF641E]/10 px-3 py-2">
      <ErrorPrimitive.Message className="text-sm text-[#FF641E]">
        ❌ {error}
      </ErrorPrimitive.Message>
    </ErrorPrimitive.Root>
  );
};

export default ErrorPanel;