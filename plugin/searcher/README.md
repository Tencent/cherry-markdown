# @cherry-markdown/plugin-searcher

通用 Markdown 编辑器搜索面板（TEditor 风格），支持匹配导航与替换。

**本包为纯 UI 核心**，不含 Cherry Markdown 集成逻辑。Cherry 用户需通过 `Cherry.usePlugin(SearcherCherryPlugin)` 按需注册（见主包 `src/addons/cherry-searcher-plugin.js`）。

## 快速开始（独立使用）

```javascript
import SearcherPanel, { DEFAULT_OPTIONS, mergeOptions } from '@cherry-markdown/plugin-searcher';
import '@cherry-markdown/plugin-searcher/styles/searcher.scss';

const editorAdapter = {
  getDocString: () => editor.getValue(),
  getSelection: () => editor.getSelection(),
  getSelectedText: () => editor.getSelectedText(),
  getCursorHead: () => editor.getCursor().head,
  setSelection: (from, to, opts) => editor.setSelection(from, to, opts),
  replaceRange: (text, from, to) => editor.replaceRange(text, from, to),
  setSearchQuery: (pattern, caseSensitive, asRegex) =>
    editor.setSearchQuery(pattern, caseSensitive, asRegex),
  clearSearchQuery: () => editor.clearSearchQuery(),
  focus: () => editor.focus(),
  isReadOnly: () => editor.isReadOnly(),
};

const panel = new SearcherPanel({
  editorAdapter,
  options: mergeOptions(DEFAULT_OPTIONS),
  mountTarget: document.body,
});

panel.show({ left: 100, top: 80, width: 0, height: 0 }, '');
```

## Cherry Markdown 集成（按需注册）

完整包与 core 包均需手动注册，在 `new Cherry()` **之前**调用 `usePlugin`：

```javascript
import Cherry from 'cherry-markdown';
// core 包：import Cherry from 'cherry-markdown/dist/cherry-markdown.core';
import SearcherCherryPlugin from 'cherry-markdown/dist/addons/cherry-searcher-plugin.esm.js';
import 'cherry-markdown/dist/cherry-markdown.min.css';
import 'cherry-markdown/dist/addons/cherry-searcher-plugin.css';

Cherry.usePlugin(SearcherCherryPlugin, { localeId: 'zh_CN' });

const cherry = new Cherry({ id: 'editor' });
// Mod+F 打开/关闭搜索；Mod+H 展开替换（无 toolbar 按钮，勿在 toolbars 中配置 searcher）
```

UMD 场景：

```html
<link rel="stylesheet" href="path/to/cherry-markdown.min.css" />
<link rel="stylesheet" href="path/to/addons/cherry-searcher-plugin.css" />
<script src="path/to/cherry-markdown.js"></script>
<script src="path/to/addons/cherry-searcher-plugin.js"></script>
<script>
  Cherry.usePlugin(CherrySearcherPlugin);
  const cherry = new Cherry({ id: 'editor' });
</script>
```

## 配置项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enableReplace` | `boolean` | `true` | 是否启用替换 |
| `expandReplaceOnOpen` | `boolean` | `false` | 打开面板时展开替换行 |
| `onSearch` | `(event) => void` | — | 搜索完成（关键词非空） |
| `onReplace` | `(event) => void` | — | 替换成功（`mode: 'single' \| 'all'`） |
| `localeId` | `'zh_CN' \| 'en_US'` | 浏览器推断 | 内置语言包 |
| `locale` | `SearcherLocale` | — | 单项文案覆盖 |

## 导出

**运行时**

- `SearcherPanel`（default）
- `DEFAULT_OPTIONS`、`mergeOptions`
- `SEARCHER_LOCALES`、`resolveLocale`
- `findMatches`、`buildSearchRegex` 等工具函数

**类型**（仅 TypeScript / IDE，无运行时产物）

- 包入口：`import type { EditorAdapter, SearcherOptions } from '@cherry-markdown/plugin-searcher'`
- 纯类型：`import type { SearcherOptions } from '@cherry-markdown/plugin-searcher/types'`
- 源码单一来源：`types/searcher.types.d.ts`（构建时复制到 `dist/searcher.types.d.ts`）

## 开发与构建

源码为 **原生 ES Module**（`import`/`export`、`class`、解构、箭头函数等），构建时不经过 Babel 转译，直接输出 ESM / UMD。

```bash
yarn workspace @cherry-markdown/plugin-searcher build
yarn workspace @cherry-markdown/plugin-searcher test
```

## 目录结构

```
types/
├── searcher.types.d.ts  # 类型单一来源（interface）
└── index.d.ts           # 包入口声明（re-export + 运行时 API）

src/
├── SearcherPanel.js     # 搜索面板 UI
├── search-utils.js      # 匹配工具
├── locale.js            # 文案解析
├── locales/             # zh_CN / en_US
├── default-options.js
├── options.js
├── dom.js
└── index.js
```

Cherry 适配（`SearcherCherryBridge`、快捷键 Mod+F/H）位于主包 `packages/cherry-markdown/src/addons/cherry-searcher-plugin.js`。
