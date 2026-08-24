# Cherry Markdown 多包架构

Cherry Markdown 按「用户场景和职责」拆分为多个独立包（[ISSUE #6](https://cnb.cool/tencent/cherry-markdown/cherry-markdown/-/issues/6)）。

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

# 各包独立示例（构建后打开对应 examples/index.html）
yarn build:engine
yarn build:preview
yarn build:stream
yarn build:milkdown
```

## 发版与治理

- 各包独立版本、独立发布（Changesets 管理）
- Engine 规则变化必须有 fixture / snapshot
- CI 检查各包不携带不应包含的依赖
