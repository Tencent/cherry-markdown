// / <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
// Vite define 注入的全局常量，命名由构建配置固定
declare const __APP_VERSION__: string;
