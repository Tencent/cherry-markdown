
## Configuration

| parameter       |  illustration         | type     | Optional value | Default value | Required |
| ---------- | --------------------- | -------- | ------ | ------ | ---- |
| value      | Binding value (original markdown) | string   | -      | -      | yew   |
| editor     | Editor configuration | object   | see below | -      | no   |
| toolbars   | toolbar configuration          | object   | see below | -      | no   |
| engine     | Using document links          | object   | see below | -      | no   |
| fileUpload | Static resource upload configuration  | function | see below | -      | yes   |
| externals  | Introducing third-party component configuration    | object   | see below | -      | no   |

### Editor Config

The codemirror instantiation parameter can be passed in to configure some editor behaviors, such as theme, etc.

```js
editor: {
  theme: 'default',
  height: '',
  defaultModel: '',
}
```

- Key: `theme`
- Description: Theme for configuring the editing area
- Type: `String`
- Default: `default`
- Options: reference resources[CodeMirror Theme configuration](https://codemirror.net/demo/theme.html)

--------

- Key: `height`
- Description: It is used to configure the height of the editing area. When the inline setting **height** style exists in the mount point, the inline style is the main style
- Type: `String`
- Default: `100%`

--------

- Key: `defaultModel`
- Description: Used to configure the editor's initial edit mode
- Type: `String`
- Default: `'edit&preview'`
- Options:
  - `editOnly`: Pure editing mode (without preview, you can switch to live preview with Scroll Sync mode or preview mode through toolbar)
  - `edit&preview`: Live preview with Scroll Sync
  - `previewOnly`: Preview mode (no edit box, there is only one button "return to edit" button in toolbar, which can switched to edit mode.)

### Toolbar Config

Cherry Markdown Editor contains three configurable toolbars，Including toolbar (fixed toolbar above)、bubble( appears toolbar when select the text) and float (appears at the beginning of a new liner), in which you can customize and add the required functions.

```js
toolbars:{                                                                                                     
    theme: 'dark', // light or dark                                                                            
    toolbar : ['bold', 'italic', 'strikethrough', '|', 'header', 'list', 'insert', 'graph', 'togglePreview'],   
    bubble : ['bold', 'italic', 'strikethrough', 'sub', 'sup', '|', 'size'], // array or false                 
    float : ['h1', 'h2', 'h3', '|', 'checklist', 'quote', 'quickTable', 'code'], // array or false         
    customMenu: {

    }
}
```

- Key: `theme`
- Description: for configuring the theme of editing area
- Type: `String`
- Default: `'dark'`
- Options:
  - `light`: Bright theme
  - `dark`: Dark theme

--------

- Key: `toolbar`
- Description: `Used to configure the top toolbar and menu button order
- Type: `Array<string | { insert: Array<string> }> | false`
- Default: `['bold', 'italic', 'strikethrough', '|', 'color', 'header', '|', 'list', { insert: [ 'image', 'audio', 'video', 'link', 'hr', 'br', 'code', 'formula', 'toc', 'table', 'line-table', 'bar-table', 'pdf', 'word', ], }, 'graph', 'settings']`
- Options:
  - `false`: Close the top menu when **false** is passed in **(not supported in v4.0.11 and earlier versions)**
  - `string[]`: Collection of menu names, the order of rendered menu buttons follows the order of elements in the array
  
--------

- Key: `bubble`
- Description: Used to configure the selected bubble toolbar
- Type: `Array<string | { insert: Array<string> }> | false`
- Default: `['bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup', '|', 'size', 'color']`
- Options:
  - `false`: Close the suspension menu when **false** is passed in
  - `string[]`: Collection of menu names, the order of rendered menu buttons follows the order of elements in the array

--------

- Key: `float`
- Description: Used to configure the float toolbar appears at the beginning of a new line
- Type: `Array<string | { insert: Array<string> }> | false`
- Default: `['bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup', '|', 'size', 'color']`
- Options:
  - `false`: Close the float toolbar when **false** is passed in
  - `string[]`: Collection of menu names, the order of rendered menu buttons follows the order of elements in the array

--------

- Key: `customMenu`
- Description:  Used to configure the theme of editing area
- Type: `Array<string | { insert: Array<string> }> | false`
- Default: `{}`

--------

#### **Built in menu name reference**

- Options:
  - **|**: Separator
  - **bold**: Bold
  - **italic**: Italics
  - **underline**: Underline
  - **strikethrough**: Delete line
  - **sub**: subscript
  - **Sup**: superscript
  - **size**: text size
  - **color**: text color
  - **header**: title menu
  - **h1**: primary title
  - **h2**: secondary title
  - **h3**: Third title
  - **checklist**: task list
  - **list**: list menu
  - **insert**: insert menu (customizable insert items)
  - **image**: insert Picture
  - **audio**: insert audio
  - **video**: insert video
  - **pdf**: insert pdf
  - **word**: inserts a word document
  - **link**: insert link
  - **hr**: insert horizontal split line
  - **br**: insert a new line
  - **code**: insert code block
  - **formula**: insert mathematical formula
  - **toc**: insert contents
  - **table**: insert table (GFM)
  - **line table**: insert a high-level table with a line chart (you need to introduce **echarts**)
  - **bar table**: insert a high-level table with a histogram (you need to introduce **ecarts**)
  - **graph**: drawing (you need to introduce **Mermaid**)
  - **Settings**: settings
  - **switchModel**: switch edit / preview mode (for single column edit / preview mode)
  - **togglePreview**: turn the preview area on / off (for  live preview with Scroll Sync)

### Engine Config

You can configure the parsing rules of markdown by configuring the engine object, such as whether chart can be used for table (Pro version is available)

```js
engine: {
    // Built in syntax configuration
    syntax: {                                       <[Object]> rule of grammar
        // Syntax switch
        // 'hookName': false,
        // Syntax configuration
        // 'hookName': {
        //
        // }
        list: {
            listNested: true // The sibling list type becomes a child after conversion
        },
        // pro Version function
        table: {
            enableChart: true,                        <[Boolean]> Activate table drawing
            chartRenderEngine: EChartsTableEngine,    <[Array]> Dependence of drawing graphics
            externals: [ 'echarts' ]                  <[Constructor]> The class for drawing graphics should include the following methods
        },
        codeBlock: {
            customRenderer: { // Custom syntax renderer
                mermaid: new MermaidCodeEngine({ mermaidAPI, theme: 'neutral' })
            }
        }
    },
    // Custom syntax
    customSyntax: {
        // 'SyntaxClass': SyntaxClass   <[Object]> Custom syntax rules. The syntax with the same name will override the default syntax of the editor
        // Force overwrite built-in syntax parser in case of name conflict
        // 'SyntaxClass': {             <[String]> hook name
        //    syntax: SyntaxClass,      <[SyntaxBase]> hook Constructor
        //    force: true,              <[Boolean]> whether force overwrite the same name hook
        //    before: 'HOOK_NAME',      <[String]> hookName，execute before this hook
        //    after: 'HOOK_NAME'        <[String]> hookName，execute before this hook
        // }
    }
}
```

- Key: `syntax`
- Description: Editor built-in syntax configuration
- Type: ``{ [HOOK_NAME: string]: { [option: string]: any } | boolean }``
- Default: `{}`

--------

- Key: `customSyntax`
- Description: Custom syntax configuration
- Type: ``{ [HOOK_NAME: string]: { [option: string]: any } | boolean }``
- Default: `{}`

Click [extensions](./extensions.md) if you want to know more custom Syntax info about Cherry Markdown
--------

### externals Config

External dependency configuration

- Type: `{ [packageName: string]: Object }`
- Default: `{}`
- Usage:
  Import from overall object

```Javascript
new Markdown({
    externals: {
        echarts: window.echarts
    }
});
```

Import through 'import'

```Javascript
import echarts from 'echarts';

new Markdown({
    externals: {
        echarts
    }
});
```

### Static resources upload config

Cherry Markdown Editor will not upload image or file directly. Cherry Markdown Editor provide the file user selected (such as pictures, word documents, etc. ) to the upstream through the hook function (fileUpload). The fileUpload accepts two incoming parameters:

1. file: file object user selects the  to upload
2. callback: After the upstream processes the static resources, it should call callback and pass in the uploaded static resource path, which will be echoed in the markdown editor.

```js
new Cherry({
  id: 'markdown',
  value: '',
  fileUpload(file, callback) {
    callback(url);
  },
});
```

### Markdown.constants

Markdown editor constants

#### Markdown.constants.HOOKS_TYPE_LIST

Syntax hook type constant list

- Type: `enum`
- Value: `{ DEFAULT: 'sentence', SEN: 'sentence', PAR: 'paragraph' }`
