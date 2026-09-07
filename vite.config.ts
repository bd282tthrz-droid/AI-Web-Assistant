import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcssVite from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { CONFIG } from "./src/config/index.ts";

// ESM 环境下获取 __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // library 模式：构建为 UMD 可嵌入脚本
  if (mode === "library") {
    return {
      // 使用 @tailwindcss/vite 插件处理 CSS，自动处理 @import、@apply、@source
      // 输出独立的 web-assistant.umd.css 文件，JS 和 CSS 完全分离
      // embed 脚本运行时通过 <link> 动态加载 CSS 到 Shadow DOM
      plugins: [
        react(),
        tailwindcssVite(),
        {
          // Vite library 模式下，JS 文件名由 fileName 控制（web-assistant.umd.js），
          // 但 CSS 文件名默认使用 entry 的 basename（web-assistant.css），与 JS 文件名不一致。
          // 此插件在 closeBundle 阶段（写入磁盘后）重命名 CSS 文件，使其与 JS 文件名保持一致。
          name: "rename-css-to-umd",
          closeBundle() {
            const oldPath = path.resolve(__dirname, "dist/web-assistant.css");
            const newPath = path.resolve(__dirname, "dist/web-assistant.umd.css");
            if (fs.existsSync(oldPath)) {
              // 如果目标文件已存在（旧构建产物），先删除
              if (fs.existsSync(newPath)) {
                fs.unlinkSync(newPath);
              }
              fs.renameSync(oldPath, newPath);
            }
          }
        }
      ],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "./src")
        }
      },
      define: {
        // 替换 process.env.NODE_ENV，部分依赖（如 React 开发模式检测）在浏览器中会引用它
        "process.env.NODE_ENV": JSON.stringify("production")
      },
      build: {
        lib: {
          entry: path.resolve(__dirname, "src/embed/index.ts"),
          name: "WebAssistant",
          formats: ["umd"],
          fileName: (format) => `web-assistant.${format}.js`
        },
        // Vite 自动输出 CSS 作为独立文件，无需自定义插件
        cssCodeSplit: false,
        // 不清理 dist 目录（保留 dev 构建产物）
        emptyOutDir: false,
        rollupOptions: {
          // 外部化所有依赖，由 UMD 脚本自行打包，确保宿主网站无需安装任何依赖
          // React 等依赖全部打包进 UMD 产物中
          external: [],
          treeshake: false
        }
      }
    };
  }

  // fab 模式：构建轻量 FAB 入口（无 React，按需加载核心包）
  if (mode === "fab") {
    return {
      plugins: [
        // 不需要 react() 和 tailwindcssVite()，FAB 入口使用纯 DOM API
      ],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "./src")
        }
      },
      define: {
        "process.env.NODE_ENV": JSON.stringify("production")
      },
      build: {
        lib: {
          entry: path.resolve(__dirname, "src/embed/fab-bootstrap.ts"),
          name: "WebAssistantFab",
          formats: ["umd"],
          fileName: (format) => `web-assistant-fab.${format}.js`
        },
        emptyOutDir: false,
        rollupOptions: {
          // FAB 入口不依赖 React，所有外部模块都不需要打包
          external: [],
          treeshake: true
        }
      }
    };
  }

  // core 模式：构建核心包（按需加载）
  if (mode === "core") {
    return {
      plugins: [
        react(),
        tailwindcssVite(),
        {
          name: "rename-core-css",
          closeBundle() {
            const oldPath = path.resolve(__dirname, "dist/web-assistant.css");
            const newPath = path.resolve(__dirname, "dist/web-assistant-core.umd.css");
            if (fs.existsSync(oldPath)) {
              if (fs.existsSync(newPath)) {
                fs.unlinkSync(newPath);
              }
              fs.renameSync(oldPath, newPath);
            }
          }
        }
      ],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "./src")
        }
      },
      define: {
        "process.env.NODE_ENV": JSON.stringify("production")
      },
      build: {
        lib: {
          entry: path.resolve(__dirname, "src/embed/core-bootstrap.ts"),
          name: "WebAssistantCore",
          formats: ["umd"],
          fileName: (format) => `web-assistant-core.${format}.js`
        },
        cssCodeSplit: false,
        emptyOutDir: false,
        rollupOptions: {
          external: [],
          treeshake: false
        }
      }
    };
  }

  // 默认 dev 模式
  return {
    plugins: [react(), tailwindcssVite()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      }
    },
    optimizeDeps: {
      // 显式声明 react-stately 的私有路径导入，确保其在预打包时被包含
      include: ["react-stately/private/flags/flags"]
    },
    server: {
      proxy: {
        "/local": {
          target: CONFIG.TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/local/, "")
        }
      }
    }
  };
});
