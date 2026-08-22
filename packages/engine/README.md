# @cherry-markdown/engine

Cherry Markdown 的解析与渲染引擎，独立于编辑器 UI。

> 这是 Cherry Markdown 多包拆分（[ISSUE #6](https://cnb.cool/tencent/cherry-markdown/cherry-markdown/-/issues/6)）的第一个落地包。
> 目标包边界：**Engine 负责 Markdown 解析、HTML 生成、Hook、自定义语法与 Node.js 渲染**，
> 不依赖 CodeMirror、工具栏和编辑器 UI。

## 功能

- Markdown 解析与 HTML 生成
- Hook 机制（`SyntaxBase` / `ParagraphBase` / `HookCenter` / 内置语法 Hook）
- 自定义语法（`createSyntaxHook`）
- Node.js 渲染（`Sanitizer.node`）
- 与 `cherry-markdown` 编辑包解耦，无 UI 依赖

## 使用

```js
import CherryEngine, {
  Engine,
  SyntaxHookBase,
  createSyntaxHook,
  Header,
  Paragraph,
  Table,
  CodeBlock,
  Link,
  Image,
} from '@cherry-markdown/engine';

const engine = new CherryEngine({
  engine: { syntax: { header: { anchorStyle: 'none' } } },
});
const html = engine.makeHtml('# Hello');
```

### 直接使用 Engine

```js
import { Engine } from '@cherry-markdown/engine';

const engine = new Engine(options, cherryInstance);
const html = engine.makeHtml('# Markdown');
```

### 自定义语法 Hook

```js
import { createSyntaxHook } from '@cherry-markdown/engine';

const MyHook = createSyntaxHook('myHook', 'sentence', {
  rule: /(\$\$[\s\S]+?\$\$)/,
  makeHtml(str) {
    return `<mark>${str}</mark>`;
  },
});
```

引擎包同时导出全部 37 个内置语法 Hook（`Header`、`Table`、`List`、`CodeBlock` 等）、
`HookCenter`/`hooksConfig`/`HOOKS_TYPE_LIST`（Hook 注册机制）、以及
`Logger`/`Sanitizer`/`UrlCache`/`urlProcessorProxy`/`defaultConfig`（运行时工具）。

## 构建与测试

```bash
yarn build          # 产出 ESM + UMD 产物到 dist/
yarn test           # vitest 单测
yarn typecheck      # tsc 类型检查
```

## 与 cherry-markdown 的关系

在 `0.x` 迁移期，`cherry-markdown` 仍保留内部引擎实现以保证兼容；本包作为引擎的
单一来源（canonical），后续迁移将逐步让 `cherry-markdown` 消费本包并移除内部重复实现。
