<p align="center"><img src="logo/new_logo.png" alt="cherry logo" width="50%"/></p>

# Cherry Markdown Writer


[![Cloud Studio Template](https://cs-res.codehub.cn/common/assets/icon-badge.svg)](https://cloudstudio.net#https://github.com/Tencent/cherry-markdown)

English | [简体中文](./README.CN.md) | [日本語](./README.JP.md)

### Document
- [初识cherry markdown 编辑器](https://github.com/Tencent/cherry-markdown/wiki/%E5%88%9D%E8%AF%86cherry-markdown-%E7%BC%96%E8%BE%91%E5%99%A8)
- [hello world](https://github.com/Tencent/cherry-markdown/wiki/hello-world)
- [配置图片&文件上传接口](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E5%9B%BE%E7%89%87&%E6%96%87%E4%BB%B6%E4%B8%8A%E4%BC%A0%E6%8E%A5%E5%8F%A3)
- [调整工具栏](https://github.com/Tencent/cherry-markdown/wiki/%E8%B0%83%E6%95%B4%E5%B7%A5%E5%85%B7%E6%A0%8F)
- [自定义语法](https://github.com/Tencent/cherry-markdown/wiki/%E8%87%AA%E5%AE%9A%E4%B9%89%E8%AF%AD%E6%B3%95)
- [配置项全解](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E9%A1%B9%E5%85%A8%E8%A7%A3)
- [配置主题](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E4%B8%BB%E9%A2%98)
- [扩展代码块语法](https://github.com/Tencent/cherry-markdown/wiki/%E6%89%A9%E5%B1%95%E4%BB%A3%E7%A0%81%E5%9D%97%E8%AF%AD%E6%B3%95)
- [事件&回调](https://github.com/Tencent/cherry-markdown/wiki/%E4%BA%8B%E4%BB%B6&%E5%9B%9E%E8%B0%83)
- [API](https://tencent.github.io/cherry-markdown/examples/api.html)

### Demos

- [full model](https://tencent.github.io/cherry-markdown/examples/index.html)
- [basic](https://tencent.github.io/cherry-markdown/examples/basic.html)
- [mobile](https://tencent.github.io/cherry-markdown/examples/h5.html)
- [multiple instances](https://tencent.github.io/cherry-markdown/examples/multiple.html)
- [editor without toolbar](https://tencent.github.io/cherry-markdown/examples/notoolbar.html)
- [pure preview](https://tencent.github.io/cherry-markdown/examples/preview_only.html)
- [XSS](https://tencent.github.io/cherry-markdown/examples/xss.html)（Not allowed by default）
- [img wysiwyg](https://tencent.github.io/cherry-markdown/examples/img.html)
- [table wysiwyg](https://tencent.github.io/cherry-markdown/examples/table.html)
- [headers with auto num](https://tencent.github.io/cherry-markdown/examples/head_num.html)
- [流式输入模式（AI chart场景）](https://tencent.github.io/cherry-markdown/examples/ai_chat.html)
- [VIM 编辑模式](https://tencent.github.io/cherry-markdown/examples/vim.html)

-----

## Introduction

Cherry Markdown Editor is a Javascript Markdown editor. It has the advantages such as out-of-the-box, lightweight and easy to extend. It can run in browser or server(with NodeJs).

### **Out-of-the-box**

Developer can call and instantiate Cherry Markdown Editor in a very simple way. The instantiated Cherry Markdown Editor supports most commonly used markdown syntax (such as title, TOC, flowchart, formula, etc.) by default.

### **Easy to extend**

When the syntax that Cherry Markdown editor support can not meet your needs, secondary development or function extention can be carried out quickly. At the same time, Cherry Markdown editor should be implemented by pure JavaScript, and should not rely on framework technology such as angular, vue and react. Framework only provide a container environment.

## Feature

### Syntax Feature

1. Image zoom, alignment and reference
2. Generate a chart based on the content of the table
3. Adjust font color and size
4. Font background color, superscript and subscript
5. Insert checklist
6. Insert audio or video

### Multiple modes

1. Live preview with Scroll Sync
2. Preview-only mode
3. No toolbar mode (minimalist editing mode)
4. Mobile preview mode

### Functional Feature

1. Copy from rich text and paste as markdown text
2. Classic line feed & regular line feed
3. Multi-cursor editing
4. Image size editing
5. Export as image or pdf
6. Float toolbar: appears at the beginning of a new line
7. Bubble toolbar: appears when text is selected

### Performance Feature

1. partial rendering
2. partial update

### Security

Cherry Markdown has a built-in security Hook, by filtering the whitelist and DomPurify to do scan filter.

### Style theme

Cherry Markdown has a variety of style themes to choose from.

### Features show

click [here](https://github.com/Tencent/cherry-markdown/wiki/%E7%89%B9%E6%80%A7%E5%B1%95%E7%A4%BA-features) for more details

## Install

Via yarn

```bash
yarn add cherry-markdown
```

Via npm

```bash
npm install cherry-markdown --save
```

If you need to enable the functions of `mermaid` drawing and table-to-chart, you need to add `mermaid` and `echarts` packages at the same time.

Currently, the plug-in version **Cherry** recommend is `echarts@4.6.0` `mermaid@9.4.3`.

```bash
# Install mermaid, enable mermaid and drawing function
yarn add mermaid@9.4.3
# Install echarts, turn on the table-to-chart function
yarn add echarts@4.6.0
```

## Quick start

### Browser

#### UMD

```html
<link href="cherry-editor.min.css" />
<div id="markdown-container"></div>
<script src="cherry-editor.min.js"></script>
<script>
  new Cherry({
    id: 'markdown-container',
    value: '# welcome to cherry editor!',
  });
</script>
```

#### ESM

```javascript
import 'cherry-markdown/dist/cherry-markdown.css';
import Cherry from 'cherry-markdown';
const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});
```

### Node

```javascript
const { default: CherryEngine } = require('cherry-markdown/dist/cherry-markdown.engine.core.common');
const cherryEngineInstance = new CherryEngine();
const htmlContent = cherryEngineInstance.makeHtml('# welcome to cherry editor!');
```

## Lite Version

Because the size of the mermaid library is very large, the cherry build product contains a core build package without built-in Mermaid. The core build can be imported in the following ways.

### Full mode (With UI Interface)

```javascript
import 'cherry-markdown/dist/cherry-markdown.css';
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';
const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});
```

### Engine Mode (Just Syntax Compile)

```javascript
// Import Cherry engine core construction
// Engine configuration items are the same as Cherry configuration items, the following document content only introduces the Cherry core package
import CherryEngine from 'cherry-markdown/dist/cherry-markdown.engine.core';
const cherryEngineInstance = new CherryEngine();
const htmlContent = cherryEngineInstance.makeHtml('# welcome to cherry editor!');

// --> <h1>welcome to cherry editor!</h1>
```

### ⚠️ About mermaid

The core build package does not contain mermaid dependency, should import related plug-ins manually.

```javascript
import 'cherry-markdown/dist/cherry-markdown.css';
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';
import CherryMermaidPlugin from 'cherry-markdown/dist/addons/cherry-code-block-mermaid-plugin';
import mermaid from 'mermaid';

// Plug-in registration must be done before Cherry is instantiated
Cherry.usePlugin(CherryMermaidPlugin, {
  mermaid, // pass in mermaid object
  // mermaidAPI: mermaid.mermaidAPI, // Can also be passed in mermaid API
  // At the same time, you can configure mermaid's behavior here, please refer to the official mermaid document
  // theme: 'neutral',
  // sequence: { useMaxWidth: false, showSequenceNumbers: true }
});

const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});
```

### Dynamic import

**recommend** Using Dynamic import, the following is an example of webpack Dynamic import.

```javascript
import 'cherry-markdown/dist/cherry-markdown.css';
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';

const registerPlugin = async () => {
  const [{ default: CherryMermaidPlugin }, mermaid] = await Promise.all([
    import('cherry-markdown/src/addons/cherry-code-block-mermaid-plugin'),
    import('mermaid'),
  ]);
  Cherry.usePlugin(CherryMermaidPlugin, {
    mermaid, // pass in mermaid object
  });
};

registerPlugin().then(() => {
  //  Plug-in registration must be done before Cherry is instantiated
  const cherryInstance = new Cherry({
    id: 'markdown-container',
    value: '# welcome to cherry editor!',
  });
});
```

## Configuration
see `/src/Cherry.config.js` or click [here](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E9%A1%B9%E5%85%A8%E8%A7%A3)

## Example

Click [here](https://github.com/Tencent/cherry-markdown/wiki) for more examples.

### Client
Under development, please stay tuned or see `/client/`

## Extension

### Customize Syntax
click [here](https://github.com/Tencent/cherry-markdown/wiki/%E8%87%AA%E5%AE%9A%E4%B9%89%E8%AF%AD%E6%B3%95)

### Customize Toolbar
click [here](https://github.com/Tencent/cherry-markdown/wiki/%E8%B0%83%E6%95%B4%E5%B7%A5%E5%85%B7%E6%A0%8F)

## Unit Test

Jest is selected as a unit testing tool for its assertion, asynchronous support and snapshot. Unit test includes CommonMark test and snapshot test.

### CommonMark Test

Call `yarn run test:commonmark` to test the official CommonMark suites. This command runs fast.

Suites are located in `test/suites/commonmark.spec.json`, for example:

```json
{
  "markdown": " \tfoo\tbaz\t\tbim\n",
  "html": "<pre><code>foo\tbaz\t\tbim\n</code></pre>\n",
  "example": 2,
  "start_line": 363,
  "end_line": 368,
  "section": "Tabs"
},
```

In this case, Jest will compare the html generated by `Cherry.makeHtml(" \tfoo\tbaz\t\tbim\n")` with the expected result `"<pre><code>foo\tbaz\t \tbim\n</code></pre>\n"`. Cherry Markdown's matcher has ignored private attributes like `data-line`.

CommonMark specifications and suites are from: https://spec.commonmark.org/ .

### Snapshot Test

Call `yarn run test:snapshot` to run snapshot test. You can write snapshot suite like `test/core/hooks/List.spec.ts`. At the first time, a snapshot will be automatically generated. After that, Jest can compare the snapshot with the generated HTML. If you need to regenerate a snapshot, delete the old snapshot under `test/core/hooks/__snapshots__` and run this command again.

Snapshot test runs slower. It should only be used to test Hooks that are error-prone and contain Cherry Markdown special syntax.

## Contributing

Welcome to join us to build a more powerful Markdown editor. Of course you can submit feature request to us. Please read [me](https://github.com/Tencent/cherry-markdown/wiki/%E5%88%9D%E8%AF%86cherry-markdown-%E7%BC%96%E8%BE%91%E5%99%A8) before you working on it.

## Stargazers over time

[![Stargazers over time](https://starchart.cc/Tencent/cherry-markdown.svg)](https://starchart.cc/Tencent/cherry-markdown)

## License

Apache-2.0
