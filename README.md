<p align="center"><img src="logo/logo--color.svg" alt="cherry logo" width="50%"/></p>

# Cherry Markdown Editor

English | [简体中文](./README.CN.md)

## Introduction

Cherry Markdown Editor is a Javascript Markdown editor. It has the advantages such as out-of-the-box, lightweight and easy to extend. It can run in browser or server(with NodeJs).

### **Out-of-the-box**

Developer can call and instantiate Cherry Markdown Editor in a very simple way. The instantiated Cherry Markdown Editor supports most commonly used markdown syntax (such as title, TOC, flowchart, formula, etc.) by default.

### **Easy to extend**

When the syntax that Cherry Markdown editor support can not meet your needs, secondary development or function extention can be carried out quickly. At the same time, Cherry Markdown editor should be implemented by pure JavaScript, and should not rely on framework technology such as angular, vue and react. Framework only provide a container environment.

DEMO **Coming soon**

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
click [here](./docs/features.md) for more details

### Demos
- [basic](https://tencent.github.io/cherry-markdown/examples/index.html)
- [mobile](https://tencent.github.io/cherry-markdown/examples/h5.html)
- [multiple instances](https://tencent.github.io/cherry-markdown/examples/multiple.html)
- [editor without toolbar](https://tencent.github.io/cherry-markdown/examples/notoolbar.html)
- [pure preview](https://tencent.github.io/cherry-markdown/examples/preview_only.html)
- [XSS](https://tencent.github.io/cherry-markdown/examples/xss.html)（Not allowed by default）
- [API](https://tencent.github.io/cherry-markdown/examples/api.html)
- [img wysiwyg](https://tencent.github.io/cherry-markdown/examples/img.html)
- [headers with auto num](https://tencent.github.io/cherry-markdown/examples/head_num.html)


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

Currently, the plug-in version **Cherry** recommend is `echarts@4.6.0` `mermaid@8.11.1`.

```bash
# Install mermaid, enable mermaid and drawing function
yarn add mermaid@8.11.1
# Install echarts, turn on the table-to-chart function
yarn add echarts@4.6.0
```

## Quick start

### Browser

#### UMD

```html
<link href="cheery-editor.min.css" />
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
import Cherry from 'cherry-markdown';
const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});
```

### Node

```javascript
const { default: Cherry } = require('cherry-markdown');
const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});
```

## Lite Version

Because the size of the mermaid library is very large, the cherry build product contains a core build package without built-in Mermaid. The core build can be imported in the following ways.

### Full mode (With UI Interface)

```javascript
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';
const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});
```

### Engine Mode  (Just Syntax Compile)

```javascript
// Import Cherry engine core construction
// Engine configuration items are the same as Cherry configuration items, the following document content only introduces the Cherry core package
import CherryEngine from 'cherry-markdown/dist/cherry-markdown.engine.core';
const cherryEngineInstance = new CherryEngine({
  value: '# welcome to cherry editor!',
});
```

### ⚠️ About mermaid

The core build package does not contain mermaid dependency, should import related plug-ins manually.

```javascript
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

**recommend**  Using Dynamic import, the following is an example of webpack Dynamic import.

```javascript
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

### Default configuration

```javascript
  {
    editor: {
      theme: 'default'
    },
    toolbars:{
      theme: 'dark'
      toolbar : ['bold', 'italic', 'strikethrough', '|', 'header', 'list', 'insert', 'graph', 'togglePreview'],
      bubble : ['bold', 'italic', 'strikethrough', 'sub', 'sup', '|', 'size'],
      float : ['h1', 'h2', 'h3', '|', 'checklist', 'quote', 'quickTable', 'code'],
      customMenu: []
    },
    engine: {
      syntax: {
        table: {
          enableChart: false,
          externals: [ 'echarts' ]
        },
      },
      customSyntax: {}
    },
    externals: {},
    fileUpload(file, callback) {
      // api.post(file).then(url => {
      //   callback(url)
      // })
    }
  }
```

### More Information

Click [here](./docs/configuration.md) for the full documentation of Cherry configuration.

## Example

Click [here](./examples/) for more examples.

## Extension

### Customize Syntax

```javascript
/*
 * Generate a hook to block sensitive words
 * named blockSensitiveWords
 * The scope is the entire page
 * The matching rules will be attached to the RULE attribute of the instance
 */
let BlockSensitiveWordsHook = Cherry.createSyntaxHook('blockSensitiveWords', 'page', {
  makeHtml(str) {
    return str.replace(this.RULE.reg, '***');
  },
  rule(str) {
    return {
      reg: /sensitive words/g,
    };
  },
});
new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
  engine: {
    customSyntax: {
      // Inject into the editor's custom grammar
      BlockSensitiveWordsHook: {
      syntaxClass: BlockSensitiveWordsHook,
      // If there is a Hook with the same name and it will be Forcibly covered 
      force: true,
      // Called before the hook for processing the picture
      // before: 'image',
      },
    },
  },
});
```

### Customize Toolbar

```javascript
/*
  * generate a hook with prefix template
  * named AddPrefixTemplate
  * Icon css class icon-add-prefix
  */
let AddPrefixTemplate = Cherry.createSyntaxHook('AddPrefixTemplate', 'icon-add-prefix', {
  onClick(selection) {
    return 'Prefix-' + selection;
  },
});
new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
  toolbars: {
    customMenu: {
      // Inject into the editor's menu
      AddPrefixTemplate,
    },
  },
});
```

Click [extensions](./docs/extensions.md) if you want knoe more extension about cherry markdown.

## Contributing

Welcome to join us to build a more powerful Markdown editor. Of course you can submit feature request to us. Please read[extensions](./docs/extensions.md) and [commit_convention](./docs/commit_convention.md) before you working on it.

## License

Apache-2.0
