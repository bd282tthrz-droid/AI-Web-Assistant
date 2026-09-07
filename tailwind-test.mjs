import postcss from "postcss";
import tailwindcssPostcss from "@tailwindcss/postcss";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const css = `@import "tailwindcss";\n\n@source "./src/features";\n\n.foo { color: red; }`;

postcss([tailwindcssPostcss({ base: __dirname })])
  .process(css, { from: path.join(__dirname, "src/embed/embed.css") })
  .then((result) => {
    const hasTheme = result.css.includes("@theme");
    const hasColorBlue = result.css.includes("--color-blue-500");
    console.log("Has @theme:", hasTheme);
    console.log("Has --color-blue-500:", hasColorBlue);
    console.log("First 300 chars:", result.css.substring(0, 300));
    console.log("Total length:", result.css.length);
  })
  .catch((err) => console.error("Error:", err.message));