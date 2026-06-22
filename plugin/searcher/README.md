# @cherry-markdown/plugin-searcher

通用 Markdown 编辑器搜索面板（TEditor 风格），支持匹配导航与替换。

**本包为纯 UI 核心**：只提供 `SearcherPanel`、匹配工具与样式，不含 Cherry Markdown 工具栏或 `usePlugin` 胶水层。

## 架构分层

| 层级 | 包 / 路径 | 职责 |
|------|-----------|------|
| UI 核心 | `@cherry-markdown/plugin-searcher` | 搜索面板、高亮、`EditorAdapter` 接口 |
| Cherry 工具栏 | `cherry-markdown` → `toolbars/hooks/Searcher.js` | 搜索图标按钮、Mod+F / Mod+H 快捷键 |
| Cherry 胶水层 | `cherry-markdown` → `addons/cherry-searcher-plugin.js` | `usePlugin` 注册、`triggerSearcher`、CodeMirror 适配 |

未调用 `Cherry.usePlugin(SearcherCherryPlugin)` 时（仅核心包且未手动注册），工具栏按钮可见但点击无效。完整包 `cherry-markdown` 已默认注册。未在 `toolbar` 中配置 `'searcher'` 时，按钮与 Mod+F / Mod+H 快捷键均不可用。

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

## Cherry Markdown 集成

### 完整包（`cherry-markdown` / `cherry-markdown.js`）

完整包在 `index.js` 中**已默认** `Cherry.usePlugin(SearcherCherryPlugin)`，并挂在 `Cherry.plugins.SearcherCherryPlugin`。只需引入样式即可使用工具栏按钮与 Mod+F / Mod+H：

```javascript
import Cherry from 'cherry-markdown';
import 'cherry-markdown/dist/cherry-markdown.min.css';
import 'cherry-markdown/dist/addons/cherry-searcher-plugin.css';

const cherry = new Cherry({
  id: 'editor',
  toolbars: {
    // 默认 toolbar 已含 'searcher'；完全自定义时需自行加入
    config: {
      searcher: {
        enableReplace: true,
        expandReplaceOnOpen: false,
      },
    },
  },
});
```

### 核心包 / 按需加载（`cherry-markdown.core.js`）

核心包不自动注册插件，需在 `new Cherry()` **之前**手动 `usePlugin`，并引入 addon 样式：

```javascript
import Cherry from 'cherry-markdown/dist/cherry-markdown.core.js';
import SearcherCherryPlugin from 'cherry-markdown/dist/addons/cherry-searcher-plugin.esm.js';
import 'cherry-markdown/dist/cherry-markdown.min.css';
import 'cherry-markdown/dist/addons/cherry-searcher-plugin.css';

Cherry.usePlugin(SearcherCherryPlugin, {
  localeId: 'zh_CN',
  enableReplace: true,
});

const cherry = new Cherry({
  id: 'editor',
  toolbars: {
    toolbar: ['bold', 'italic', '|', 'searcher', 'togglePreview'],
  },
});
```

- **工具栏按钮**：点击搜索图标打开/关闭面板
- **Mod+F**：打开 / 关闭搜索面板
- **Mod+H**：打开并展开替换行（`enableReplace: false` 时不注册）

UMD 场景（核心包 + 独立 addon 脚本）：

```html
<link rel="stylesheet" href="path/to/cherry-markdown.min.css" />
<link rel="stylesheet" href="path/to/addons/cherry-searcher-plugin.css" />
<script src="path/to/cherry-markdown.js"></script>
<script src="path/to/addons/cherry-searcher-plugin.js"></script>
<script>
  Cherry.usePlugin(CherrySearcherPlugin, { localeId: 'zh_CN' });
  const cherry = new Cherry({ id: 'editor' });
</script>
```

## 配置项

通过 `Cherry.usePlugin(SearcherCherryPlugin, options)` 传入，并写入 `toolbars.config.searcher`。实例级可在 `new Cherry({ toolbars: { config: { searcher: {...} }}})` 中覆盖：

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enableReplace` | `boolean` | `true` | 是否启用替换 |
| `expandReplaceOnOpen` | `boolean` | `false` | 打开面板时展开替换行 |
| `closeOnClickOutside` | `boolean` | `true` | 点击面板外时自动关闭（面板内任意点击保持打开） |
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

**类型**（仅 TypeScript / IDE）

- 包入口：`import type { EditorAdapter, SearcherOptions } from '@cherry-markdown/plugin-searcher'`
- 纯类型：`import type { SearcherOptions } from '@cherry-markdown/plugin-searcher/types'`
- 单一来源：`types/searcher.types.d.ts`（构建时复制到 `dist/searcher.types.d.ts`）

Cherry 集成类型由 `cherry-markdown` 构建生成：`dist/types/addons/cherry-searcher-plugin.d.ts`。

## 开发与构建

```bash
yarn workspace @cherry-markdown/plugin-searcher build
yarn workspace @cherry-markdown/plugin-searcher test
```

Cherry 侧 addon（JS + CSS + d.ts）：

```bash
yarn workspace cherry-markdown build:addons
```

## 目录结构

```
types/
├── searcher.types.d.ts  # UI 类型单一来源
└── index.d.ts           # 包入口声明

src/
├── SearcherPanel.js     # 搜索面板 UI
├── search-utils.js      # 匹配工具
├── locale.js
├── locales/
└── index.js
```
