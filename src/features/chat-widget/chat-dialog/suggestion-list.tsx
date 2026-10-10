import { motion, AnimatePresence } from "framer-motion";
import { ThreadPrimitive } from "@assistant-ui/react";
import { type FC } from "react";
import { getSuggestions } from "@/constants/suggestion";

interface SuggestionListProps {
  readonly visible: boolean;
}

const SuggestionList: FC<SuggestionListProps> = ({ visible }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-auto mt-2 flex flex-col gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}>
          {getSuggestions().map((suggestion) => (
            <ThreadPrimitive.Suggestion
              key={suggestion.prompt}
              className="rounded-lg border border-[#F5D2AF]/40 bg-[#F5D2AF]/20 px-6 py-1 text-sm text-[#F5D2AF]/80 backdrop-blur-sm hover:bg-[#F5D2AF]/30 cursor-pointer transition-colors"
              prompt={suggestion.prompt}
              send>
              {suggestion.title}
            </ThreadPrimitive.Suggestion>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuggestionList;
