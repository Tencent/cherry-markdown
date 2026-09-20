import { defineConfig } from 'vite-plus';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  /**
   * 使用相对路径作为资源基础路径。
   * 该项目会被部署到 GitHub Pages 的子目录
   * （https://tencent.github.io/cherry-markdown/examples/config_helper/）
   * 以及 PR 预览的 surge.sh 子目录（/config_helper/），
   * 相对路径可保证在任意子路径下都能正确加载 js / css / 图片。
   */
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
