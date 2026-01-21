# 测试目录结构说明

## 目录结构

```
test/
├── setup.ts                    # 全局测试设置（mock 浏览器 API）
│
├── __mocks__/                  # Mock 文件目录
│   └── codemirror.mock.ts      # 编辑器 Mock（支持工具函数测试）
│
├── unit/                       # 单元测试
│   ├── codemirror/             # 编辑器相关测试
│   │   ├── Editor.spec.ts      # 编辑器工具函数测试（正则、计算）
│   │   ├── selection.spec.ts   # 选区工具函数测试
│   │   ├── shortcutKey.spec.ts # 快捷键工具函数测试
│   │   └── autoindent.spec.ts  # 列表自动缩进测试
│   │
│   └── utils/                  # 纯工具函数测试
│       ├── regexp.spec.ts      # 正则表达式测试（全面覆盖）
│       ├── color.spec.ts       # 颜色转换函数测试
│       ├── sanitize.spec.ts    # HTML 转义/安全函数测试
│       ├── LRUCache.spec.ts    # LRU 缓存类测试
│       ├── myersDiff.spec.ts   # Myers' Diff 算法测试
│       ├── lineFeed.spec.ts    # 换行处理函数测试
│       ├── recount-pos.spec.ts # 光标位置重算测试
│       ├── lookbehind-replace.spec.ts # 后向断言替换测试
│       ├── image.spec.ts       # 图片扩展语法测试
│       ├── config.spec.ts      # 配置管理函数测试
│       ├── error.spec.ts       # 错误处理工具测试
│       ├── dom.spec.ts         # DOM 工具函数测试
│       └── mathjax.spec.ts     # 公式转义函数测试
│
├── core/                       # 核心渲染引擎测试
│   ├── CommonMark.spec.ts      # CommonMark 规范兼容性测试
│   └── hooks/                  # Hooks 语法扩展测试
│       ├── AutoLink.spec.ts    # 自动链接测试
│       └── List.spec.ts        # 列表语法测试
│
├── suites/                     # 测试数据/测试套件
│   └── commonmark.spec.json    # CommonMark 测试用例数据
│
├── example.md                  # 示例 Markdown 文件
└── node.js                     # Node 环境测试
```

## 测试原则

### 只测试真实逻辑

```typescript
// ✅ 好：测试真实的函数逻辑
it('应该计算正确的滚动百分比', () => {
  expect(calculateScrollPercent(100, 80, 20)).toBe(1);
});

// ❌ 避免：只检查数据定义
it('应该定义事件类型', () => {
  const events = ['blur', 'focus'];
  expect(events).toContain('blur');  // 永远通过，无意义
});
```

### 与 CodeMirror 版本无关

当前的测试都是纯函数测试，不依赖 CM5 或 CM6 的具体实现。

## 工具函数测试覆盖

### `unit/utils/` 目录

| 文件 | 测试内容 | 测试数量 | 覆盖率 |
|------|---------|---------|--------|
| `color.spec.ts` | `hexToRgb`, `rgbToHex`, `rgbToHsv`, `hsvToRgb` | 21 | 100% |
| `sanitize.spec.ts` | `escapeHTMLSpecialChar`, `isValidScheme`, `encodeURIOnce` 等 | 37 | 98% |
| `LRUCache.spec.ts` | LRU 缓存的 `get`, `set`, `has`, `delete`, `clear` | 19 | 100% |
| `myersDiff.spec.ts` | Myers' Diff 算法的 `doDiff`, `findSnakes` | 20 | 99% |
| `lineFeed.spec.ts` | `prependLineFeedForParagraph`, `calculateLinesOfParagraph` | 12 | 100% |
| `recount-pos.spec.ts` | `getPosBydiffs` 光标位置重算 | 23 | 100% |
| `lookbehind-replace.spec.ts` | `replaceLookbehind` 后向断言替换 | 25 | - |
| `image.spec.ts` | `imgAltHelper` 图片扩展语法解析 | 31 | 100% |
| `regexp.spec.ts` | `compileRegExp`, `getTableRule`, URL/EMAIL 正则等 | 55 | 99% |
| `config.spec.ts` | localStorage 配置管理（主题、代码高亮等） | 33 | - |
| `error.spec.ts` | `$expectTarget`, `$expectInherit`, `NestedError` | 37 | 100% |
| `dom.spec.ts` | `getHTML`, `createElement`, `loadScript`, `loadCSS` | 24 | 49% |
| `mathjax.spec.ts` | `escapeFormulaPunctuations` 公式转义 | 51 | 94% |

### `unit/codemirror/` 目录

| 文件 | 测试内容 |
|------|---------|
| `Editor.spec.ts` | 全角字符正则、滚动计算、Base64 图片正则 |
| `selection.spec.ts` | `getSelection()` 工具函数 |
| `shortcutKey.spec.ts` | 快捷键处理函数 |
| `autoindent.spec.ts` | 列表自动缩进函数 |

## 运行测试

```bash
# 运行所有测试
yarn workspace cherry-markdown test

# 运行特定目录
yarn workspace cherry-markdown test test/unit/utils

# 运行单个文件
yarn workspace cherry-markdown test test/unit/utils/color.spec.ts
```
