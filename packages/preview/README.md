# @cherry-markdown/preview

Cherry Markdown 的纯预览渲染包，不依赖编辑器 UI。

> 多包拆分（[ISSUE #6](https://cnb.cool/tencent/cherry-markdown/cherry-markdown/-/issues/6)）的预览层包。
> 目标包边界：**Preview 负责纯 Markdown 预览、预览 DOM、预览交互和样式**，
> 依赖 `@cherry-markdown/engine`，不依赖编辑器。

## 功能

- 将 engine 渲染出的 HTML 增量更新到预览 DOM（基于 Myers Diff + virtual-dom）
- 图片懒加载
- `update` / `refresh` / `getValue` / `setContent` 等核心 API
- 不依赖 CodeMirror / 工具栏 / 编辑器

## 使用

```js
import CherryEngine from '@cherry-markdown/engine';
import Previewer from '@cherry-markdown/preview';

const engine = new CherryEngine({});
const html = engine.makeHtml('# Hello\n\n**World**');

const previewer = new Previewer({
  previewerDom: document.getElementById('preview'),
  lazyLoadImg: { autoLoadImgNum: -1 },
});
previewer.update(html);
```

## 测试

```bash
yarn workspace @cherry-markdown/preview test
```

## Demo

```bash
# 构建后打开 packages/preview/examples/index.html
yarn workspace @cherry-markdown/preview build
```
