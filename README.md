<p align="center"><img src="logo/new_logo.png" alt="cherry logo" width="50%"/></p>

# Cherry Markdown Writer

English | [简体中文](./README.CN.md)

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

click [here](./docs/guide/features.md) for more details

### Demos

- [basic](https://tencent.github.io/cherry-markdown/examples/index.html)
- [mobile](https://tencent.github.io/cherry-markdown/examples/h5.html)
- [multiple instances](https://tencent.github.io/cherry-markdown/examples/multiple.html)
- [editor without toolbar](https://tencent.github.io/cherry-markdown/examples/notoolbar.html)
- [pure preview](https://tencent.github.io/cherry-markdown/examples/preview_only.html)
- [XSS](https://tencent.github.io/cherry-markdown/examples/xss.html)（Not allowed by default）
- [API](https://tencent.github.io/cherry-markdown/examples/api.html)
- [img wysiwyg](https://tencent.github.io/cherry-markdown/examples/img.html)
- [table wysiwyg](https://tencent.github.io/cherry-markdown/examples/table.html)
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
  // Third party package
  externals: {
    // externals
  },
  // engine configuration
  engine: {
    // Global configuration
    global: {
      // Enable classic new line logic
      // true：One line break is ignored and more than two consecutive lines break into paragraphs
      // false： One line break will turn into < br >, two consecutive line breaks will be divided into paragraphs, and more than three consecutive line breaks will turn into < br > and divide into paragraphs
      classicBr: false,
      /**
       * global URL processor
       * @param {string} url 来源url
       * @param {'image'|'audio'|'video'|'autolink'|'link'} srcType 来源类型
       * @returns
       */
      urlProcessor: callbacks.urlProcessor,
      /**
       * Additional HTML tags that allow rendering
       * Labels are separated by vertical lines in English，such as htmlWhiteList: 'iframe|script|style'
       * It is empty by default. See Src / utils / sanitize.html for the HTML allowed to be rendered by default JS whitelist property
       * attention：
       *    - After enabling iframe, script and other tags, XSS injection will be generated. Please judge whether it needs to be enabled according to the actual scene
       *    - Generally, scenes with controllable editing permissions (such as API document system) can allow iframe, script and other tags
       */
      htmlWhiteList: '',
    },
    // Built in syntax configuration
    syntax: {
      // Syntax switch
      // 'hookName': false,
      // Syntax configuration
      // 'hookName': {
      //
      // }
      autoLink: {
        /** default open short link display */
        enableShortLink: true,
        /** default display 20 characters */
        shortLinkLength: 20,
      },
      list: {
        listNested: false, // The sibling list type becomes a child after conversion
        indentSpace: 2, // Default 2 space indents
      },
      table: {
        enableChart: false,
        // chartRenderEngine: EChartsTableEngine,
        // externals: ['echarts'],
      },
      inlineCode: {
        theme: 'red',
      },
      codeBlock: {
        theme: 'dark', // Default to dark theme
        wrap: true, // If it exceeds the length, whether to wrap the line. If false, the scroll bar will be displayed
        lineNumber: true, // Default display line number
        customRenderer: {
          // Custom syntax renderer
        },
        /**
         * indentedCodeBlock Is the switch whether indent code block is enabled
         *
         *    this syntax is not supported by default in versions before 6.X.
         *    Because cherry's development team thinks the syntax is too ugly (easy to touch by mistake)
         *    The development team hopes to completely replace this syntax with ` ` code block syntax
         *    However, in the subsequent communication, the development team found that the syntax had better display effect in some scenarios
         *    Therefore, the development team in 6 This syntax was introduced in version X
         *    if you want to upgrade the following versions of services without users' awareness, you can remove this syntax:
         *        indentedCodeBlock：false
         */
        indentedCodeBlock: true,
      },
      emoji: {
        useUnicode: true, // Whether to render using Unicode
      },
      fontEmphasis: {
        allowWhitespace: false, // Allow leading and trailing spaces
      },
      strikethrough: {
        needWhitespace: false, // Must there be a first space
      },
      mathBlock: {
        engine: 'MathJax', // katex or MathJax
        src: '',
        plugins: true, // Default load plug-in
      },
      inlineMath: {
        engine: 'MathJax', // katex or MathJax
        src: '',
      },
      toc: {
        /** By default, only one directory is rendered */
        allowMultiToc: false,
      },
      header: {
        /**
         * Style of title：
         *  - default       Default style with anchor in front of title
         *  - autonumber    There is a self incrementing sequence number anchor in front of the title
         *  - none          Title has no anchor
         */
        anchorStyle: 'default',
      },
    },
  },
  editor: {
    codemirror: {
      // depend on codemirror theme name: https://codemirror.net/demo/theme.html
      // manual import theme: `import 'codemirror/theme/<theme-name>.css';`
      theme: 'default',
    },
    // The height of the editor is 100% by default. If the height of the mount point has an inline setting, the inline style will prevail
    height: '100%',
    // defaultModel The default mode of the editor after initialization. There are three modes: 1. Double column edit preview mode; 2. Pure editing mode; 3. Preview mode
    // edit&preview: Double column edit preview mode
    // editOnly: Pure editing mode (without preview, you can switch to double column or preview mode through toolbar)
    // previewOnly: Preview mode (there is no edit box, the toolbar only displays the "return to edit" button, which can be switched to edit mode through the toolbar)
    defaultModel: 'edit&preview',
    // Whether to automatically convert HTML to markdown when pasting
    convertWhenPaste: true,
  },
  // toolbar configuration
  toolbars: {
    theme: 'dark', // light or dark
    showToolbar: true, // False: the top toolbar is not displayed; True: display toolbar; toolbars. Showtoolbar = false and toolbars Toolbar = false equivalent
    toolbar: [
      'bold',
      'italic',
      'strikethrough',
      '|',
      'color',
      'header',
      '|',
      'list',
      {
        insert: [
          'image',
          'audio',
          'video',
          'link',
          'hr',
          'br',
          'code',
          'formula',
          'toc',
          'table',
          'line-table',
          'bar-table',
          'pdf',
          'word',
        ],
      },
      'graph',
      'settings',
    ],
    sidebar: [],
    bubble: ['bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup', 'quote', '|', 'size', 'color'], // array or false
    float: ['h1', 'h2', 'h3', '|', 'checklist', 'quote', 'quickTable', 'code'], // array or false
  },
  fileUpload: callbacks.fileUpload,
  callback: {
    afterChange: callbacks.afterChange,
    afterInit: callbacks.afterInit,
    beforeImageMounted: callbacks.beforeImageMounted,
  },
  previewer: {
    dom: false,
    className: 'cherry-markdown',
    // Whether to enable the editing ability of preview area (currently supports editing picture size and table content)
    enablePreviewerBubble: true,
  },
  // The preview page does not need to bind events
  isPreviewOnly: false,
  // The preview area automatically scrolls with the editor cursor
  autoScrollByCursor: true,
  // Whether to force output to the body when the outer container does not exist
  forceAppend: true,
  // The locale Cherry is going to use. Locales live in /src/locales/
  locale: 'zh_CN',
}
```

### Close float menu or bubble menu

```javascript
  toolbars: {
    ... // other config
    bubble: false, // array or false
    float: false, // array or false
  },

```

### More Information

Click [here](./docs/configuration.md) for the full documentation of Cherry configuration.

## Example

Click [here](./examples/) for more examples.

### Client

[cherry-markdown client](./docs/cherry_editor_client.md)

## Extension

### Customize Syntax

#### sentence Syntax

If there are no additional special requirements for the compiled content, use the sentence syntax

```javascript
/*
 * Generate a hook to block sensitive words
 * named blockSensitiveWords
 * The matching rules will be attached to the RULE attribute of the instance
 */
let BlockSensitiveWordsHook = Cherry.createSyntaxHook('blockSensitiveWords', Cherry.constants.HOOKS_TYPE_LIST.SEN, {
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

#### paragraph Syntax

If the compiled content requires no external influence, use paragraph syntax

```javascript
/*
 * Generate a hook to block sensitive words
 * named blockSensitiveWords
 * The matching rules will be attached to the RULE attribute of the instance
 */
let BlockSensitiveWordsHook = Cherry.createSyntaxHook('blockSensitiveWords', Cherry.constants.HOOKS_TYPE_LIST.PAR, {
  // Enable caching to protect content
  needCache: true,
  // Pretreatment to avoid external influence
  beforeMakeHtml(str) {
    return str.replace(this.RULE.reg, (match, code) => {
      const lineCount = (match.match(/\n/g) || []).length;
      const sign = this.$engine.md5(match);
      const html = `<div data-sign="${sign}" data-lines="${lineCount + 1}" >***</div>`;
      return this.pushCache(html, sign, lineCount);
    });
  },
  makeHtml(str, sentenceMakeFunc) {
    return str;
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
let AddPrefixTemplate = Cherry.createMenuHook('AddPrefixTemplate', 'icon-add-prefix', {
  onClick(selection) {
    return 'Prefix-' + selection;
  },
});
new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
  toolbars: {
    toolbar: [
      'bold',
      // ...other toolbar items
      // @see src/Cherry.config.js
      'settings',
      'addPrefix', // append custom menu item to main top toolbar
    ],
    bubble: [
      'bold' /** ...other toolbar items */,
      ,
      'color',
      'addPrefix', // append custom menu item to bubble toolbar (appears on selection)
    ], // array or false
    float: [
      'h1' /** ...other toolbar items */,
      ,
      'code',
      'addPrefix', // append custom menu item to float toolbar (appears on new empty line)
    ], // array or false
    customMenu: {
      // Inject into the editor's menu
      // object key as item's unique name for toolbars'configuration
      addPrefix: AddPrefixTemplate,
    },
  },
});
```

Click [extensions](./docs/extensions.md) if you want know more extension about cherry markdown.

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

Welcome to join us to build a more powerful Markdown editor. Of course you can submit feature request to us. Please read[extensions](./docs/extensions.md) and [commit_convention](./docs/commit_convention.md) before you working on it.

## Stargazers over time

[![Stargazers over time](https://starchart.cc/Tencent/cherry-markdown.svg)](https://starchart.cc/Tencent/cherry-markdown)

## License

Apache-2.0
