# @cherry-markdown/plugin-searcher

Cherry Markdown 的文档搜索插件，提供 TEditor 风格的单行搜索面板。

## 功能

- 工具栏按钮 + `Mod+F` 快捷键唤起
- 单行搜索框：搜索图标、输入、清空、大小写、全字匹配、匹配计数与上下导航
- **替换**：可展开替换行，支持单个替换与全部替换（`Mod+H` 直接打开替换）
- 编辑器内关键词高亮，支持跳转到匹配项
- 最近搜索标签（localStorage 持久化，可删除）
- 选中文本后打开搜索，自动填入关键词

## 安装

### npm 发布包（推荐外部项目使用）

```bash
yarn add cherry-markdown @cherry-markdown/plugin-searcher
# 或
npm install cherry-markdown @cherry-markdown/plugin-searcher
```

```javascript
import Cherry from 'cherry-markdown';
import SearcherPlugin from '@cherry-markdown/plugin-searcher';
import 'cherry-markdown/dist/cherry-markdown.css';

// 须在 new Cherry() 之前注册
Cherry.usePlugin(SearcherPlugin, {
  placeholder: '搜索...',
});

const cherry = new Cherry({
  id: 'editor',
  toolbars: {
    toolbar: ['bold', 'italic', 'searcher', '|', 'togglePreview'],
  },
});
```

> `Cherry.usePlugin(SearcherPlugin)` 会自动注册 `searcher` 工具栏菜单；工具栏配置中需包含 `'searcher'` 按钮名。

### monorepo 内开发

本包作为 workspace 与 `cherry-markdown` 联调，源码入口在 `src/`，发版产物在 `dist/`。

## 快速开始（monorepo / 已内置 hook）

`cherry-markdown` 完整包已内置 `searcher` 工具栏 hook，在工具栏配置中加入按钮名即可：

```javascript
import Cherry from 'cherry-markdown';

const cherry = new Cherry({
  id: 'editor',
  toolbars: {
    toolbar: ['bold', 'italic', 'searcher', '|', 'togglePreview'],
  },
});
```

## 可选配置

通过 `Cherry.usePlugin` 传入选项（须在 `new Cherry()` **之前**调用）：

```javascript
import Cherry from 'cherry-markdown';

Cherry.usePlugin(Cherry.plugins.SearcherPlugin, {
  placeholder: '搜索...',
  recentTitle: '最近文本',
  maxRecentCount: 10,
  storageKey: 'my-app-searcher-recent',
  recentTexts: [{ value: 'TODO', label: 'TODO' }],
  onTagDelete(value) {
    // 返回 false 可阻止删除
    console.log('delete tag:', value);
  },
});

const cherry = new Cherry({ /* ... */ });
```

| 选项 | 类型 | 说明 |
|------|------|------|
| `placeholder` | `string` | 搜索框占位文本 |
| `recentTitle` | `string` | 最近搜索区域标题 |
| `recentTexts` | `Array<{ value, label? }>` | 初始/推荐标签 |
| `maxRecentCount` | `number` | 最大历史条数，默认 `10` |
| `storageKey` | `string` | localStorage 键名 |
| `onTagDelete` | `(value) => boolean \| void` | 标签删除回调 |
| `enableReplace` | `boolean` | 是否启用替换，默认 `true` |
| `defaultExpandReplace` | `boolean` | 打开面板时是否默认展开替换行，默认 `false` |

配置会合并到 `toolbars.config.searcher`，也可直接在 Cherry 实例配置里写入：

```javascript
new Cherry({
  toolbars: {
    config: {
      searcher: { placeholder: '搜索...' },
    },
  },
});
```

## 快捷键

| 快捷键 | 行为 |
|--------|------|
| `Mod+F` | 打开/关闭搜索面板 |
| `Mod+H` | 打开搜索面板并展开替换行（需 `enableReplace: true`） |
| `Enter`（搜索框） | 跳到下一个匹配 |
| `Shift+Enter`（搜索框） | 跳到上一个匹配 |
| `Enter`（替换框） | 替换当前匹配并跳到下一项 |
| `Shift+Enter`（替换框） | 替换当前匹配，停留在同序号位置 |
| `Escape` | 有内容时清空；无内容时关闭面板 |

## 替换用法

1. 点击搜索框左侧 **▶** 按钮展开替换行，或使用 `Mod+H`
2. 输入查找内容与「替换为」文本
3. 点击 **替换** 替换当前项；点击 **全部替换** 批量替换
4. 若不需要替换，可在配置中关闭：`enableReplace: false`

## 独立引入（UMD / cherry-markdown addons 目录）

发版构建产物：

| 文件 | 说明 |
|------|------|
| `dist/cherry-searcher-plugin.js` | UMD，浏览器 `<script>` 或 `require` |
| `dist/cherry-searcher-plugin.esm.js` | ESM，`import` 使用 |

也可从 `cherry-markdown` 主包读取同步副本：

```javascript
import SearcherPlugin from 'cherry-markdown/dist/addons/cherry-searcher-plugin.esm.js';
```

## 导出 API

```javascript
import SearcherPlugin, {
  SearcherMenu,
  SearcherPanel,
  findMatches,
  buildSearchRegex,
} from '@cherry-markdown/plugin-searcher';
```

## 目录结构

```
plugin/searcher/
├── README.md
├── package.json
├── src/
│   ├── index.js           # SearcherPlugin 入口
│   ├── SearcherMenu.js    # 工具栏按钮
│   ├── SearcherPanel.js   # 搜索面板 UI
│   ├── search-utils.js    # 匹配工具函数
│   └── styles/searcher.scss
└── test/
    └── search-utils.spec.ts
```

## 发版

```bash
# 构建 dist 产物（prepublishOnly 会自动执行）
yarn workspace @cherry-markdown/plugin-searcher build

# 发布到 npm
yarn workspace @cherry-markdown/plugin-searcher publish
```

构建后会生成：

```
dist/
├── cherry-searcher-plugin.js      # UMD
├── cherry-searcher-plugin.esm.js  # ESM
└── index.d.ts                     # TypeScript 类型
```

## 开发

```bash
# 构建
yarn workspace @cherry-markdown/plugin-searcher build

# 测试
yarn workspace @cherry-markdown/plugin-searcher test
```

## 依赖

- `cherry-markdown`（peerDependency）
- `lodash`（mergeWith 合并配置）
