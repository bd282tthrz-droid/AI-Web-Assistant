const fs = require("fs");
const umd = fs.readFileSync(
  "D:\\htmlItem\\AI\\web-assistant\\dist\\web-assistant.umd.js",
  "utf-8"
);

// 提取 CSS 内容
const uStart = 842;
const backtickStart = umd.indexOf("`", uStart);
let cssEnd = -1;
for (let i = backtickStart + 1; i < umd.length; i++) {
  if (umd[i] === "`" && (i === 0 || umd[i-1] !== "\\")) {
    cssEnd = i;
    break;
  }
}
const cssContent = umd.substring(backtickStart + 1, cssEnd);

// 搜索关键类作为子字符串（不转义）
console.log("=== Simple string search ===");
const keywords = ["z-0", "z-[2147483647]", "h-[500px]", "w-[380px]", "fixed", "flex"];
for (const k of keywords) {
  console.log(`'${k}': ${cssContent.includes(k)}`);
}

// 检查 CSS 的 @layer utilities 中的内容
// 第一个 @layer utilities
const firstUtil = cssContent.indexOf("@layer utilities");
const firstUtilEnd = cssContent.indexOf("@layer", firstUtil + 1);
if (firstUtil >= 0 && firstUtilEnd >= 0) {
  const firstUtilContent = cssContent.substring(firstUtil, firstUtilEnd);
  console.log(`\nFirst @layer utilities: ${firstUtil} to ${firstUtilEnd}, length: ${firstUtilContent.length}`);
  
  // 检查是否包含 z-0
  const z0Idx = firstUtilContent.indexOf("z-0");
  if (z0Idx >= 0) {
    console.log("z-0 found in first utilities at", z0Idx);
    console.log("Context:", firstUtilContent.substring(Math.max(0, z0Idx - 20), z0Idx + 30));
  } else {
    console.log("z-0 NOT found in first utilities");
  }
  
  // 检查 utilities 中最后一个类
  const lastClass = firstUtilContent.match(/\.([\w-\\[\]\]+)\s*\{/g);
  if (lastClass) {
    console.log("Last 10 classes:", lastClass.slice(-10));
  }
}

// 第二个 @layer utilities
const secondUtil = cssContent.indexOf("@layer utilities", firstUtil + 1);
if (secondUtil >= 0) {
  const secondUtilEnd = cssContent.indexOf("@layer", secondUtil + 1);
  const endPos = secondUtilEnd >= 0 ? secondUtilEnd : cssContent.length;
  const secondUtilContent = cssContent.substring(secondUtil, endPos);
  console.log(`\nSecond @layer utilities: ${secondUtil} to ${endPos}, length: ${secondUtilContent.length}`);
  
  // 检查是否包含 z-0
  const z0Idx = secondUtilContent.indexOf("z-0");
  if (z0Idx >= 0) {
    console.log("z-0 found in second utilities");
  } else {
    console.log("z-0 NOT found in second utilities");
  }
  
  const lastClass = secondUtilContent.match(/\.([\w-\\[\]\]+)\s*\{/g);
  if (lastClass) {
    console.log("Last 10 classes:", lastClass.slice(-10));
  }
}

// 检查 CSS 中是否有 z-index 相关的类
console.log("\n=== z-index related ===");
const zIndexClasses = cssContent.match(/\.z-[\w-\\[\]\]+/g);
if (zIndexClasses) {
  console.log("z- classes:", zIndexClasses.slice(0, 20));
  console.log("Total z- classes:", zIndexClasses.length);
} else {
  console.log("No z- classes found in CSS");
}

// 检查 h- 相关的类
console.log("\n=== h- related ===");
const hClasses = cssContent.match(/\.h-[\w-\\[\]\]+/g);
if (hClasses) {
  console.log("h- classes:", hClasses.slice(0, 20));
  console.log("Total h- classes:", hClasses.length);
} else {
  console.log("No h- classes found in CSS");
}

// 检查 CSS 中是否包含 .relative
console.log("\n.relative:", cssContent.includes(".relative"));
console.log(".absolute:", cssContent.includes(".absolute"));