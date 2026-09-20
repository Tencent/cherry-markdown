# Cherry Markdown 配置生成器（config_helper）

基于 React + TypeScript + Vite（vite-plus）的可视化配置生成器，可实时预览并一键导出 `new Cherry(config)` 所需的配置代码。

在线地址：<https://tencent.github.io/cherry-markdown/examples/config_helper/>

## 目录结构

```
examples/config_helper
├── index.html                # Vite 入口
├── public/logo_icon.png      # 静态资源
├── src/
│   ├── main.tsx              # React 入口（引入 Tailwind / FontAwesome / Cherry 样式）
│   ├── App.tsx               # 页面骨架与全局交互
│   ├── style.css             # 自定义样式（含 `@import 'tailwindcss'`）
│   ├── types.ts              # 类型定义
│   ├── constants.ts          # 仓库 / Cherry.config.js 源码地址
│   ├── data/config-data.ts   # 所有可配置项、预设、配置参考源码片段（数据源）
│   ├── hooks/                # useConfigState（状态与派生配置）、useToast
│   ├── utils/                # 配置生成 / 代码格式化 / 高亮 / 剪贴板 等纯函数
│   └── components/           # UI 组件
├── vite.config.ts            # base: './'，保证部署到任意子路径均可访问
└── postcss.config.mjs        # Tailwind v4 via @tailwindcss/postcss
```

## 本地开发

本项目通过 `cherry-markdown: "*"` 直接引用 monorepo 中的核心包，因此首次运行前需要先构建核心包：

```bash
# 仓库根目录
vp install
vp run build:core                 # 生成 packages/cherry-markdown/dist（含类型声明）
vp run example:configHelper       # 启动开发服务器
```

## 构建

```bash
vp run build:configHelper         # 产物输出到 examples/config_helper/dist
```

根目录的 `vp run build` 也会一并构建本项目。

## 部署方式

- **GitHub Pages**（`.github/workflows/deploy-pages.yml`）：将 `examples/config_helper/dist/` 的内容复制到
  `gh-pages-out/examples/config_helper/`，因此线上 URL 保持不变：
  `https://tencent.github.io/cherry-markdown/examples/config_helper/`（`index.html` 可省略，也可显式访问）。
- **PR 预览 Playground**（`.github/workflows/reusable-playground-build.yml`）：复制到 `playground/config_helper/`，
  对应预览链接 `https://preview-pr-<id>-cherry-markdown.surge.sh/config_helper/`。

由于 `vite.config.ts` 中设置了 `base: './'`，所有资源均使用相对路径引用，无需为不同部署路径单独配置。
