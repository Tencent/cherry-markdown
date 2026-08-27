# @cherry-markdown/milkdown

Cherry Markdown 基于 Milkdown / ProseMirror 的所见即所得（WYSIWYG）实验包。

> 多包拆分（[ISSUE #6](https://cnb.cool/tencent/cherry-markdown/cherry-markdown/-/issues/6)）的所见即所得实验层。
> 第一阶段定位：**独立验证所见即所得编辑能力，不进入 `cherry-markdown` 默认依赖**。
> 目标包边界：`@cherry-markdown/milkdown` 只代表第一阶段的 Milkdown 实现，不创建抽象的 WYSIWYG API。

## 功能

- 基于 Milkdown / ProseMirror 的所见即所得编辑
- Markdown 与文档模型双向 round-trip
- `onChange` 回调输出最新 Markdown
- 第一阶段的独立实验，验证后决定是否进入主包

## 使用

```js
import CherryMilkdown from '@cherry-markdown/milkdown';
import '@cherry-markdown/milkdown/style.css';

const editor = new CherryMilkdown({
  el: document.getElementById('editor'),
  value: '# 标题\n\n**加粗** 文本',
  onChange: (markdown) => console.log(markdown),
});
await editor.create();

const md = await editor.getMarkdown();
```

## 测试

```bash
yarn workspace @cherry-markdown/milkdown test
```

## Demo

```bash
# 构建后打开 packages/milkdown/examples/index.html
yarn workspace @cherry-markdown/milkdown build
```
