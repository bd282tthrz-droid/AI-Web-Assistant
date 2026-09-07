import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const content = fs.readFileSync(
  path.join(__dirname, "dist/web-assistant.umd.js"),
  "utf-8"
);

// Find the CSS variable assignment (u = `...`)
const cssStart = content.indexOf("u=`/*! tailwindcss");
if (cssStart === -1) {
  console.log("Could not find CSS start marker");
  process.exit(1);
}

// Find the end of the CSS string (the backtick before the next meaningful code)
const cssEnd = content.indexOf("`", cssStart + 50);
if (cssEnd === -1) {
  console.log("Could not find CSS end");
  process.exit(1);
}

const css = content.substring(cssStart + 2, cssEnd);

console.log("First 500 chars of CSS:");
console.log(css.substring(0, 500));
console.log("---");
console.log("Has @layer theme:", css.includes("@layer theme"));
console.log("Has :root:", css.includes(":root"));
console.log("Has :host:", css.includes(":host"));
console.log("Has --color-blue-500:", css.includes("--color-blue-500"));
console.log("Has @theme:", css.includes("@theme"));
console.log("Total CSS length:", css.length);