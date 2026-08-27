# @cherry-markdown/stream

Cherry Markdown 的流式渲染包，适用于 AI Token 流式渲染场景。

> 多包拆分（[ISSUE #6](https://cnb.cool/tencent/cherry-markdown/cherry-markdown/-/issues/6)）的流式层包。
> 目标包边界：**Stream 负责 AI Token 流式 Markdown 渲染、未闭合语法处理、增量刷新**，
> 依赖 `@cherry-markdown/engine` 和 `@cherry-markdown/preview`，不依赖 CodeMirror。

## 功能

- 流式 Markdown 渲染（`setValue` 增量刷新）
- 未闭合语法处理（依赖 engine）
- 不依赖 CodeMirror / 工具栏 / 编辑器 UI，包体积更小
- 目录提取 `getToc`、HTML 输出 `getHtml` 等

## 使用

```js
import CherryStream from '@cherry-markdown/stream';
import '@cherry-markdown/preview/style.css';

const stream = new CherryStream({
  el: document.getElementById('preview'),
  forceAppend: true,
  value: '# 初始内容',
});

// 流式输出：每次传入增量 markdown
stream.setValue('# 标题');
stream.setValue('# 标题\n\n这是**加粗**');
stream.setValue('# 标题\n\n这是**加粗**\n\n- 列表');
```

## 测试

```bash
yarn workspace @cherry-markdown/stream test
```

## Demo

```bash
# 构建后打开 packages/stream/examples/index.html
yarn workspace @cherry-markdown/stream build
```
