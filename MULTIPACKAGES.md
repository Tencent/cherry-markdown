# Cherry Markdown 多包架构

Cherry Markdown 按「用户场景和职责」拆分为多个独立包（[GitHub Issue #1862](https://github.com/Tencent/cherry-markdown/issues/1862)）。

## 包一览

| 包 | 用途 | 边界 |
| --- | --- | --- |
| `cherry-markdown` | 编辑器、编辑区、编辑区 + 预览区、工具栏、快捷键 | 可依赖 CodeMirror、engine、preview；默认编辑器入口 |
| `@cherry-markdown/engine` | Markdown 解析、HTML 生成、Hook、自定义语法、Node.js 渲染 | 不依赖 CodeMirror、工具栏和 UI |
| `@cherry-markdown/preview` | 纯 Markdown 预览、预览 DOM、预览交互和样式 | 依赖 engine，不依赖编辑器 |
| `@cherry-markdown/stream` | AI Token 流式 Markdown 渲染、未闭合语法处理、增量刷新 | 依赖 engine 和 preview，不依赖 CodeMirror |
| `@cherry-markdown/milkdown` | 基于 Milkdown 的所见即所得实验 | 第一阶段独立验证，不进入 `cherry-markdown` 默认依赖 |

## 依赖关系

```text
cherry-markdown ──→ @cherry-markdown/preview ──→ @cherry-markdown/engine
        │
        └──────────────→ @cherry-markdown/engine

@cherry-markdown/stream ──→ @cherry-markdown/preview ──→ @cherry-markdown/engine

@cherry-markdown/milkdown ──→ Milkdown
                         └──→ @cherry-markdown/engine
```

## 目录结构

```text
packages/
├── cherry-markdown/   # 编辑器（默认入口）
├── engine/            # @cherry-markdown/engine
├── preview/           # @cherry-markdown/preview
├── stream/            # @cherry-markdown/stream
├── milkdown/          # @cherry-markdown/milkdown（实验）
├── client/
├── miniProgram/
└── vscodePlugin/
```

## 各包构建 / 测试 / 演示

```bash
# 构建所有独立包（engine / preview / stream / milkdown）
yarn build:packages

# 测试所有独立包
yarn test:packages

# 原有示例保持不变；新版包边界验收页统一使用 /new- 前缀和【new】标识
yarn build:engine
yarn build:preview
yarn build:stream
yarn build:milkdown
yarn workspace cherry-markdown dev
# /new-engine.html /new-preview.html /new-stream.html /new-milkdown.html
vp run verify:demos # CI 同步检查路由、【new】标识、包解析和浏览器模块转换
```

## 发版与治理

- 各包独立版本、独立发布（Changesets 管理）
- Engine 规则变化必须有 fixture / snapshot
- CI 检查各包不携带不应包含的依赖

## 0.x 历史入口迁移

0.x 仍生成以下历史文件，但它们只是新包的转发/组合入口，不再拥有独立实现。它们将在 1.0 删除。

| 历史入口 | 新入口 |
| --- | --- |
| `cherry-markdown.core.*` | `cherry-markdown` 默认编辑器入口 |
| `cherry-markdown.engine.core.*` | `@cherry-markdown/engine` |
| `cherry-markdown.engine.*` | `@cherry-markdown/engine` + 根包 Mermaid 插件 |
| `cherry-markdown.stream.*` | `@cherry-markdown/stream` |

`previewOnly` 仍是编辑器运行模式，不再承担“移除 CodeMirror 的纯预览构建”职责；纯预览请使用
`@cherry-markdown/preview`。新源码禁止依赖上述历史入口或依赖根包的内部源码路径。
