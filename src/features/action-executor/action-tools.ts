// Action tool definitions (Dify mode)
// Sent via Dify API inputs.tools parameter to guide AI in generating structured instruction blocks
// 4 维元素定位策略：css_selector → text_match → data_attributes → anchor_context

// Tool definition structure (internal type, TS native)
interface ToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly arguments: Record<string, string>;
}

// All available tool definitions
export const TOOL_DEFINITIONS: readonly ToolDefinition[] = [
  {
    name: "click_element",
    description: "Click on a page element, such as add-to-cart button, navigation link, etc. (requires user confirmation)",
    arguments: {
      data_attributes: "data-* attribute selector (e.g. [data-assistant-action='add-to-cart'])",
      css_selector: "PRIMARY selector - direct CSS selector from the interactive elements table's '最佳选择器' column (e.g. .btn-orange.px-3). Fill this first.",
      text_match: "Exact visible text of the element (e.g. 'Add to Cart'). Fill from '元素文本' column.",
      anchor_context: "FALLBACK only - JSON: { anchorText: 'nearby product title text from 父链上下文 column', targetSelector: 'simple tag name like button or a' }. Only use when css_selector and text_match are insufficient.",
      confirmRequired: "true (always requires user confirmation for click)"
    }
  },
  {
    name: "fill_input",
    description: "Fill content into an input/search field. For search boxes, this auto-presses Enter after filling to trigger search. For form fields, use batch_fill instead.",
    arguments: {
      data_attributes: "data-* attribute selector (e.g. [data-assistant-action='search-input'])",
      css_selector: "PRIMARY selector - direct CSS selector from the interactive elements table's '最佳选择器' column",
      text_match: "Input placeholder or label text. Fill from '元素文本' column.",
      anchor_context: "FALLBACK only - JSON: { anchorText: 'label text', targetSelector: 'input' }",
      value: "Content to fill (required)"
    }
  },
  {
    name: "scroll_to",
    description: "Scroll the page to a specified element or position (auto-execute)",
    arguments: {
      data_attributes: "data-* attribute selector for target element",
      css_selector: "PRIMARY selector - direct CSS selector from the interactive elements table's '最佳选择器' column",
      text_match: "Text content of the element to scroll to. Fill from '元素文本' column.",
      anchor_context: "FALLBACK only - JSON: { anchorText: 'anchor text', targetSelector: 'simple tag name' }",
      position: "Scroll position: top or bottom (alternative to element selectors)"
    }
  },
  {
    name: "navigate_to",
    description: "Navigate to a specified URL (requires user confirmation)",
    arguments: {
      url: "Target URL (required)"
    }
  },
  {
    name: "highlight_element",
    description: "Highlight a page element to draw user attention (auto-execute)",
    arguments: {
      data_attributes: "data-* attribute selector",
      css_selector: "PRIMARY selector - direct CSS selector from the interactive elements table's '最佳选择器' column",
      text_match: "Visible text of the element. Fill from '元素文本' column.",
      anchor_context: "FALLBACK only - JSON: { anchorText: 'anchor text', targetSelector: 'simple tag name' }"
    }
  },
  {
    name: "batch_fill",
    description: "Fill multiple form fields at once with a single user confirmation. Use this for inquiry forms, checkout forms, registration forms, etc. Does NOT submit the form. (requires user confirmation)",
    arguments: {
      fields: "JSON array of field objects: [{\"css_selector\": \"#fullname\", \"value\": \"John\"}, {\"css_selector\": \"#email\", \"value\": \"john@example.com\"}]. Each field uses standard element selectors (css_selector, text_match, data_attributes)."
    }
  },
  {
    name: "submit_form",
    description: "Submit the form containing the specified element (auto-execute)",
    arguments: {
      css_selector: "CSS selector of any element inside the target form",
      text_match: "Visible text of any element inside the target form",
      data_attributes: "data-* attribute of any element inside the target form"
    }
  }
] as const;

// JSON string of tool definitions (for Dify inputs)
export const TOOL_DEFINITIONS_JSON = JSON.stringify(TOOL_DEFINITIONS);

// System Prompt tool usage instructions
export const TOOL_USAGE_PROMPT = `
## Available Tools

You can use the following tools to help users interact with web pages. When an action needs to be performed, embed an instruction block in the reply using the following format:

\`\`\`action
{
  "tool": "tool_name",
  "params": { ... }
}
\`\`\`

### Tool List

${TOOL_DEFINITIONS.map(
  (tool) => `
#### ${tool.name}
${tool.description}
Parameters: ${JSON.stringify(tool.arguments)}`
).join("\n")}

### Usage Rules
1. Each reply may contain at most one instruction block
2. Instruction blocks must be wrapped in \`\`\`action
3. Parameter values must be strings (except anchor_context which is a JSON object)
4. Element location priority: css_selector > text_match > data_attributes > anchor_context
5. Use anchor_context ONLY when css_selector and text_match cannot uniquely identify the element (e.g. product cards with identical buttons)
6. click_element, navigate_to, and batch_fill require user confirmation before execution
7. fill_input, submit_form, scroll_to, and highlight_element execute automatically
8. Use batch_fill (not fill_input) when the user wants to fill multiple fields in a form
9. After batch_fill, use submit_form to submit the form if the user asks`.trim();