import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { networkInterfaces } from "os";

// 原生获取本地局域网 IPv4 地址的函数
const getLocalIPv4 = () => {
  const interfaces = networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
};

export default defineConfig(async () => {
  const localIP = getLocalIPv4();

  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            // 放行 mdui- 开头的 Web Components 组件
            isCustomElement: (tag) => tag.startsWith("mdui-"),
          },
        },
      }),
    ],
    clearScreen: false,
    server: {
      port: 1420,
      strictPort: true,
      host: true,
      hmr: {
        protocol: "ws",
        host: localIP,
        port: 1421,
      },
      // 🌟 【核心修复】让 Vite 彻底忽略整个 Rust 后端目录，防止 DLL 文件锁死崩溃
      watch: {
        ignored: ["**/src-tauri/**"],
      },
    },
  };
});