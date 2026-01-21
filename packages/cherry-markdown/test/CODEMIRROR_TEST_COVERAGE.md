# CodeMirror 测试覆盖跟踪文档

> 本文档用于跟踪 CodeMirror5 测试覆盖范围，以及升级到 CodeMirror6 前需要补充的测试清单。
>
> 最后更新：2026-01-21

---

## 一、当前 CodeMirror5 测试覆盖范围

### 1.1 编辑器相关测试 (`unit/codemirror/`)

| 文件 | 状态 | 测试内容 |
|------|:----:|---------|
| `Editor.spec.ts` | ✅ | 全角字符正则匹配、滚动位置计算、行跳转位置计算、Base64图片正则 |
| `EditorCore.spec.ts` | ✅ | dealSpecialWords、formatBigData2Mark、formatFullWidthMark、toHalfWidth、handlePaste、onScroll、jumpToLine |
| `SearchReplace.spec.ts` | ✅ | 搜索光标操作、正则/大小写/全字匹配、替换/全部替换、搜索状态管理 |
| `ContentHandlers.spec.ts` | ✅ | 表格编辑、列表编辑、代码块编辑 |
| `ToolbarInteraction.spec.ts` | ✅ | MenuBase选区操作、Bubble/FloatMenu定位、Suggester建议列表、坐标转换、事件系统 |
| `AuxiliaryFeatures.spec.ts` | ✅ | Undo/Redo撤销重做、Toc目录导航、历史记录、行遍历、事件防抖 |
| `selection.spec.ts` | ✅ | `getSelection()` 基本行为、多光标模式、type=line/word、边界情况 |
| `shortcutKey.spec.ts` | ✅ | 快捷键过滤、修饰键组合、平台差异(Mac/Win)、localStorage存储 |
| `autoindent.spec.ts` | ✅ | Cherry列表自动缩进（中文数字、罗马数字）、disableInput处理 |

### 1.2 行为测试 (`unit/behavior/`)

> 这些测试验证 "输入 → 输出" 的映射关系，不依赖具体编辑器实现，升级 CM6 后**无需修改**。

| 文件 | 状态 | 测试内容 |
|------|:----:|---------|
| `text-transform.spec.ts` | ✅ | 加粗/斜体/删除线/标题/链接/图片/引用/列表等 Markdown 语法转换（82项） |
| `editor-adapter.spec.ts` | ✅ | 编辑器适配器接口定义、Mock 实现、端到端行为验证（23项） |
| `advanced-scenarios.spec.ts` | ✅ | 多行选区、嵌套格式、边界情况、撤销重做、粘贴行为、搜索替换、光标恢复（66项） |

### 1.3 集成测试 (`integration/`)

> 使用真实或模拟的 CodeMirror 实例验证交互行为，升级 CM6 时可用于**对比差异**。

| 文件 | 状态 | 测试内容 |
|------|:----:|---------|
| `codemirror5.spec.ts` | ✅ | 基础编辑功能、Markdown 编辑行为、回归测试数据表（34项） |

### 1.4 工具函数测试 (`unit/utils/`)

| 文件 | 状态 | 与 CM 相关性 | 测试内容 |
|------|:----:|:----:|---------|
| `recount-pos.spec.ts` | ✅ | 高 | `getPosBydiffs` 光标位置重算 |
| `regexp.spec.ts` | ✅ | 中 | base64Reg, imgDrawioXmlReg, longTextReg |
| `myersDiff.spec.ts` | ✅ | 中 | Myers' Diff 算法（内容比较） |

### 1.5 Mock 层 (`__mocks__/codemirror.mock.ts`)

已模拟的 CM5 API：

| 分类 | API |
|------|-----|
| 文本操作 | `getValue`, `setValue`, `getLine`, `lineCount`, `getLineHandle` |
| 光标操作 | `getCursor`, `setCursor` |
| 选区操作 | `getSelection`, `getSelections`, `setSelection`, `listSelections`, `replaceSelection`, `replaceSelections`, `replaceRange` |
| 单词查找 | `findWordAt` |
| 命令执行 | `execCommand` |
| 选项 | `getOption`, `setOption` |
| 标记 | `markText`, `findMarks`, `getAllMarks` |
| 搜索 | `getSearchCursor` (findNext, findPrevious, from, to, replace) |
| Overlay | `addOverlay`, `removeOverlay` |
| 滚动 | `getScrollInfo`, `scrollTo`, `scrollIntoView`, `getScrollerElement` |
| 坐标 | `charCoords`, `coordsChar`, `lineAtHeight` |
| DOM | `getWrapperElement`, `getInputField`, `display.wrapper` |
| 事件 | `on`, `off` |
| 焦点 | `focus`, `hasFocus` |
| 文档 | `getDoc` |
| 其他 | `refresh`, `save`, `operation`, `destroy` |

#### Mock 内存优化

为避免测试过程中的内存溢出问题，Mock 层实现了以下优化：

| 优化项 | 说明 |
|--------|------|
| **延迟创建 DOM** | `display.wrapper` 使用 getter 延迟创建，避免 IIFE 立即分配内存 |
| **缓存复用元素** | `getWrapperElement()`、`getInputField()` 缓存返回同一实例 |
| **`destroy()` 方法** | 手动清理 DOM 元素、标记数组和内部状态 |
| **全局 afterEach 清理** | `setup.ts` 中每个测试后清理 `document.body` 子元素 |

---

## 二、升级 CodeMirror6 前需要补充的测试

### 2.1 高优先级 - 核心编辑器功能

| 模块 | 状态 | 测试项 | 备注 |
|------|:----:|--------|------|
| **Editor.js 核心方法** | ✅ | `dealSpecialWords` | 大字符串省略号处理 |
| | ✅ | `formatBigData2Mark` | markText 标记功能 |
| | ✅ | `formatFullWidthMark` | 全角符号高亮 |
| | ✅ | `toHalfWidth` | 全角转半角 |
| | ✅ | `handlePaste` | 粘贴处理（HTML转MD、图片上传） |
| | ✅ | `onScroll` | 滚动同步 |
| | ✅ | `jumpToLine`/`scrollToLineNum` | 行跳转动画 |
| **搜索替换** (`cm-search-replace.js`) | ✅ | 搜索光标操作 | |
| | ✅ | 正则/大小写/全字匹配 | |
| | ✅ | 替换/全部替换 | |
| | ✅ | 滚动条匹配标记 | |
| **内容处理器** | ✅ | `tableContentHandler.js` | 表格编辑 |
| | ✅ | `listContentHandler.js` | 列表编辑 |
| | ✅ | `codeBlockContentHandler.js` | 代码块编辑 |

### 2.2 中优先级 - 工具栏交互

| 模块 | 状态 | 测试项 | 备注 |
|------|:----:|--------|------|
| **MenuBase.js** | ✅ | 工具栏按钮与编辑器交互 | |
| | ✅ | 选区获取和文本插入 | |
| **Bubble.js / FloatMenu.js** | ✅ | 浮动菜单定位 | |
| | ✅ | 编辑器坐标转换 | |
| **Suggester.js** | ✅ | 建议列表触发 | |
| | ✅ | 光标位置检测 | |

### 2.3 低优先级 - 辅助功能

| 模块 | 状态 | 测试项 | 备注 |
|------|:----:|--------|------|
| **Undo.js / Redo.js** | ✅ | 撤销/重做历史 | |
| **Toc.js** | ✅ | 目录导航跳转 | |

---

## 三、CM5 → CM6 API 对应关系

> 详细的升级指南和适配器实现模板请参考 **[CM6_UPGRADE_GUIDE.md](./CM6_UPGRADE_GUIDE.md)**

| CM5 API | CM6 等效 | 备注 |
|---------|---------|------|
| `getValue`/`setValue` | `EditorState.doc.toString()` / `EditorView.dispatch` | 文档操作方式完全不同 |
| `getCursor` | `EditorState.selection.main.head` | 选区模型变化 |
| `getSearchCursor` | `@codemirror/search` | 搜索 API 重构 |
| `markText` | `Decoration` | 装饰系统完全重写 |
| `on`/`off` | `EditorView.updateListener` | 事件系统变化 |
| `execCommand` | `EditorView.dispatch` + Command | 命令系统变化 |
| `getSelection`/`setSelection` | `EditorState.selection` | 选区 API 变化 |
| `replaceRange` | `EditorView.dispatch({ changes })` | 文本修改方式变化 |
| `scrollIntoView` | `EditorView.dispatch({ effects: EditorView.scrollIntoView })` | 滚动 API 变化 |

---


## 四、测试进度统计

| 分类 | 已完成 | 待完成 | 覆盖率 |
|------|:------:|:------:|:------:|
| 编辑器测试 (unit/codemirror) | 9 | 0 | 100% |
| 行为测试 (unit/behavior) | 3 | 0 | 100% |
| 集成测试 (integration) | 1 | 0 | 100% |
| 工具函数 | 3 | 0 | 100% |
| Mock API | 30+ | - | - |
| **高优先级待补充** | 14 | 0 | 100% |
| **中优先级待补充** | 6 | 0 | 100% |
| **低优先级待补充** | 2 | 0 | 100% |

---

## 五、更新日志

| 日期 | 更新内容 |
|------|---------|
| 2026-01-21 | 初始化文档，记录当前 CM5 测试覆盖范围 |
| 2026-01-21 | 完成高优先级测试：EditorCore.spec.ts (46项)、SearchReplace.spec.ts (43项)、ContentHandlers.spec.ts (65项)，共154项测试 |
| 2026-01-21 | 完成中优先级测试：ToolbarInteraction.spec.ts (89项)，覆盖 MenuBase/Bubble/FloatMenu/Suggester |
| 2026-01-21 | 完成低优先级测试：AuxiliaryFeatures.spec.ts (46项)，覆盖 Undo/Redo/Toc，全部测试完成 |
| 2026-01-21 | 新增行为测试：text-transform.spec.ts (82项)、editor-adapter.spec.ts (23项)，提供 CM 无关的纯函数测试 |
| 2026-01-21 | 新增集成测试：codemirror5.spec.ts (34项)，验证真实编辑器行为，为 CM6 升级提供回归基准 |
| 2026-01-21 | 修复内存溢出问题：优化 Mock 层 DOM 元素管理（延迟创建、缓存复用、destroy 清理），添加全局 afterEach 清理钩子 |
| 2026-01-21 | 创建 CM6 升级指南 (CM6_UPGRADE_GUIDE.md)：包含适配器层实现模板、升级步骤、回归测试数据表 |
| 2026-01-21 | 新增高级场景测试 advanced-scenarios.spec.ts (66项)：多行选区、嵌套格式、边界情况、撤销重做、粘贴、搜索替换、光标恢复 |

---

## 状态图例

- ✅ 已完成
- 🔄 进行中
- ⬜ 待完成
- ❌ 已取消
