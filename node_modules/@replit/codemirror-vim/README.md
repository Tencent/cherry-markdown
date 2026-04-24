# Vim keybindings for CM6

<span><a href="https://replit.com/@util/codemirror-vim" title="Run on Replit badge"><img src="https://replit.com/badge/github/replit/codemirror-vim" alt="Run on Replit badge" /></a></span>
<span><a href="https://www.npmjs.com/package/@replit/codemirror-vim" title="NPM version badge"><img src="https://img.shields.io/npm/v/@replit/codemirror-vim?color=blue" alt="NPM version badge" /></a></span>

## Installation

```sh
npm i @replit/codemirror-vim
```

## Usage

```js
import { basicSetup, EditorView } from 'codemirror';
import { vim } from "@replit/codemirror-vim"

let view = new EditorView({
  doc: "",
  extensions: [
    // make sure vim is included before other keymaps
    vim(), 
    // include the default keymap and all other keymaps you want to use in insert mode
    basicSetup, 
  ],
  parent: document.querySelector('#editor'),
})
```
> **Note**:
> if you are not using `basicSetup`, make sure you include the [drawSelection](https://codemirror.net/docs/ref/#view.drawSelection) plugin to correctly render the selection in visual mode.

## Usage of cm5 vim extension api

The same api that could be used in previous version of codemirror https://codemirror.net/doc/manual.html#vimapi, can be used with this plugin too, just replace the old editor instance with `view.cm` in your code

```js
import {Vim, getCM} from "@replit/codemirror-vim"

let cm = getCM(view)
// use cm to access the old cm5 api
Vim.exitInsertMode(cm)
Vim.handleKey(cm, "<Esc>")
```

### Define additional ex commands
```js
Vim.defineEx('write', 'w', function() {
    // save the file
});
```

### Map keys
```js
Vim.map("jj", "<Esc>", "insert"); // in insert mode
Vim.map("Y", "y$"); // in normal mode
```

### Unmap keys

```js
Vim.unmap("jj", "insert");
```

### Add custom key

```js
  defaultKeymap.push({ keys: 'gq', type: 'operator', operator: 'hardWrap' });
  Vim.defineOperator("hardWrap", function(cm, operatorArgs, ranges, oldAnchor, newHead) {
    // make changes and return new cursor position
  });
```

## Credits

This plugin was originally authored by [@mightyguava](https://github.com/mightyguava) (Yunchi Luo) as part of [CodeMirror](https://github.com/codemirror/dev), before being extracted and maintained here.
