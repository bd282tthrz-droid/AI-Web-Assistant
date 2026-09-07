import type { ActionCall } from "./action-types";
import { createDebugLogger } from "@/utils/debug-log";

// Action instruction parser
// Extracts structured instruction blocks from AI reply text

// Instruction block format:
// ```action
// { "tool": "click_element", "params": { ... }, "confirmRequired": true }
// ```

// Match ```action ... ``` code blocks
const ACTION_BLOCK_REGEX = /```action\s*([\s\S]*?)```/g;

// Module-level debug logger (removed in production build)
const debugLog = createDebugLogger("[action-parser]");

// Parse all Action instructions from text
export const parseActionsFromMessage = (text: string): ActionCall[] => {
  debugLog.log("Parse start, input text length:", text.length);
  debugLog.log("Raw text preview:", text.slice(0, 200));

  const actions: ActionCall[] = [];

  // Reset regex lastIndex (required for global regex)
  ACTION_BLOCK_REGEX.lastIndex = 0;

  // Check for action block marker
  const hasActionMarker = /```action/.test(text);
  debugLog.log("Has ```action marker:", hasActionMarker);

  // Count code fence markers
  const codeFenceCount = (text.match(/```/g) || []).length;
  debugLog.log("Code fence count:", codeFenceCount, "(should be even for balanced fences)");

  if (!hasActionMarker) {
    debugLog.log("Parse failed: no ```action marker found in text");
    debugLog.log("Parse end, result count:", 0);
    return [];
  }

  if (codeFenceCount < 2 || codeFenceCount % 2 !== 0) {
    debugLog.warn("Unbalanced code fences detected");
  }

  let matchIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ACTION_BLOCK_REGEX.exec(text)) !== null) {
    matchIndex++;
    debugLog.log(`--- Matched action block #${matchIndex} ---`);
    debugLog.log("Match position: index=", match.index, "~", match.index + match[0].length);

    const jsonStr = match[1].trim();
    debugLog.log("Extracted JSON string:", jsonStr);

    if (!jsonStr) {
      debugLog.log("Skipped: empty JSON content");
      continue;
    }

    try {
      const parsed: unknown = JSON.parse(jsonStr);
      debugLog.log("JSON parsed successfully:", parsed);

      // Validate basic structure
      if (isValidActionCall(parsed)) {
        debugLog.log("Validation passed:", parsed);
        actions.push(parsed);
      } else {
        debugLog.warn("Validation failed: missing tool or params field, or wrong type");
        debugLog.warn("Expected structure: { tool: string, params: object }");
        debugLog.warn("Actual structure:", JSON.stringify(parsed, null, 2));
      }
    } catch (error) {
      debugLog.error("JSON parse failed:", error instanceof Error ? error.message : error);
      debugLog.error("Raw string:", jsonStr);
    }
  }

  debugLog.log("Regex match complete, matched", matchIndex, "action blocks");
  debugLog.log("Valid action count:", actions.length);
  if (actions.length === 0 && matchIndex === 0) {
    debugLog.warn("Parse failed: regex did not match a complete ```action ... ``` structure");
    debugLog.warn("Possible causes:");
    debugLog.warn("  1. Missing closing ``` marker");
    debugLog.warn("  2. Extra characters between ``` and action");
    debugLog.warn("  3. Dify reply node not wrapped in ```action");
  }
  debugLog.log("Parse end");

  return actions;
};

// Type guard: validate object is a valid ActionCall
const isValidActionCall = (obj: unknown): obj is ActionCall => {
  if (typeof obj !== "object" || obj === null) return false;

  const o = obj as Record<string, unknown>;
  if (typeof o.tool !== "string") return false;
  if (typeof o.params !== "object" || o.params === null) return false;

  return true;
};

// Remove all instruction blocks from text (for clean display text)
export const stripActionBlocks = (text: string): string => {
  return text.replace(ACTION_BLOCK_REGEX, "").trim();
};

// Check if text contains instruction blocks
export const hasActionBlock = (text: string): boolean => {
  ACTION_BLOCK_REGEX.lastIndex = 0;
  return ACTION_BLOCK_REGEX.test(text);
};