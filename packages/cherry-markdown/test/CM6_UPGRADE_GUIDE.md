# CodeMirror 6 升级指南

> 本文档提供从 CodeMirror 5 升级到 CodeMirror 6 的完整测试保障方案。

---

## 一、升级前的准备工作清单

### ✅ 已完成

| 项目 | 说明 | 位置 |
|------|------|------|
| 行为测试 | 82 项纯函数测试，验证 Markdown 语法转换 | `unit/behavior/text-transform.spec.ts` |
| 适配器接口 | 定义 `IEditorAdapter` 抽象接口 | `unit/behavior/editor-adapter.spec.ts` |
| 回归测试数据 | 15 个核心编辑操作的输入/输出对照表 | `integration/codemirror5.spec.ts` |
| Mock 内存优化 | 延迟创建、缓存复用、destroy 清理 | `__mocks__/codemirror.mock.ts` |

### ⬜ 待完成

| 项目 | 说明 | 优先级 |
|------|------|:------:|
| 创建 `src/core/EditorAdapter.ts` | 将接口定义移到源码中 | 高 |
| 实现 `CM5Adapter` | 包装现有 CM5 实例 | 高 |
| 实现 `CM6Adapter` | 包装 CM6 实例 | 高 |
| 重构 `Editor.js` | 使用适配器替代直接 CM 调用 | 高 |
| 重构工具栏代码 | MenuBase 等使用适配器 | 中 |
| E2E 测试 | 验证完整用户流程 | 低 |

---

## 二、适配器层实现模板

### 2.1 接口定义 (`src/core/EditorAdapter.ts`)

```typescript
/**
 * 光标/选区位置
 */
export interface Position {
  line: number;
  ch: number;
}

/**
 * 选区范围
 */
export interface SelectionRange {
  anchor: Position;
  head: Position;
}

/**
 * 编辑器适配器接口
 * 定义了编辑器必须提供的核心能力
 */
export interface IEditorAdapter {
  // ========== 内容操作 ==========
  /** 获取全部内容 */
  getValue(): string;
  /** 设置全部内容 */
  setValue(value: string): void;
  /** 获取指定行内容 */
  getLine(lineNum: number): string;
  /** 获取总行数 */
  lineCount(): number;

  // ========== 光标操作 ==========
  /** 获取光标位置 */
  getCursor(): Position;
  /** 设置光标位置 */
  setCursor(pos: Position): void;

  // ========== 选区操作 ==========
  /** 获取选中文本 */
  getSelection(): string;
  /** 获取所有选区的文本（多光标） */
  getSelections(): string[];
  /** 设置选区 */
  setSelection(anchor: Position, head?: Position): void;
  /** 获取所有选区 */
  listSelections(): SelectionRange[];
  /** 替换选中内容 */
  replaceSelection(text: string): void;
  /** 替换所有选区内容（多光标） */
  replaceSelections(texts: string[]): void;

  // ========== 范围操作 ==========
  /** 替换指定范围的内容 */
  replaceRange(text: string, from: Position, to: Position): void;
  /** 查找光标位置的单词边界 */
  findWordAt(pos: Position): SelectionRange;

  // ========== 滚动操作 ==========
  /** 滚动到指定位置可见 */
  scrollIntoView(pos: Position): void;
  /** 获取滚动信息 */
  getScrollInfo(): { top: number; left: number; height: number; width: number };

  // ========== 焦点操作 ==========
  /** 聚焦编辑器 */
  focus(): void;
  /** 是否有焦点 */
  hasFocus(): boolean;

  // ========== 事件操作 ==========
  /** 监听事件 */
  on(event: string, handler: Function): void;
  /** 移除事件监听 */
  off(event: string, handler: Function): void;

  // ========== 生命周期 ==========
  /** 销毁编辑器 */
  destroy(): void;
}
```

### 2.2 CM5 适配器实现 (`src/core/CM5Adapter.ts`)

```typescript
import type { IEditorAdapter, Position, SelectionRange } from './EditorAdapter';
import type CodeMirror from 'codemirror';

export class CM5Adapter implements IEditorAdapter {
  private cm: CodeMirror.Editor;

  constructor(cm: CodeMirror.Editor) {
    this.cm = cm;
  }

  // ========== 内容操作 ==========
  getValue(): string {
    return this.cm.getValue();
  }

  setValue(value: string): void {
    this.cm.setValue(value);
  }

  getLine(lineNum: number): string {
    return this.cm.getLine(lineNum);
  }

  lineCount(): number {
    return this.cm.lineCount();
  }

  // ========== 光标操作 ==========
  getCursor(): Position {
    const cursor = this.cm.getCursor();
    return { line: cursor.line, ch: cursor.ch };
  }

  setCursor(pos: Position): void {
    this.cm.setCursor(pos);
  }

  // ========== 选区操作 ==========
  getSelection(): string {
    return this.cm.getSelection();
  }

  getSelections(): string[] {
    return this.cm.getSelections();
  }

  setSelection(anchor: Position, head?: Position): void {
    this.cm.setSelection(anchor, head);
  }

  listSelections(): SelectionRange[] {
    return this.cm.listSelections().map(sel => ({
      anchor: { line: sel.anchor.line, ch: sel.anchor.ch },
      head: { line: sel.head.line, ch: sel.head.ch },
    }));
  }

  replaceSelection(text: string): void {
    this.cm.replaceSelection(text);
  }

  replaceSelections(texts: string[]): void {
    this.cm.replaceSelections(texts);
  }

  // ========== 范围操作 ==========
  replaceRange(text: string, from: Position, to: Position): void {
    this.cm.replaceRange(text, from, to);
  }

  findWordAt(pos: Position): SelectionRange {
    const range = this.cm.findWordAt(pos);
    return {
      anchor: { line: range.anchor.line, ch: range.anchor.ch },
      head: { line: range.head.line, ch: range.head.ch },
    };
  }

  // ========== 滚动操作 ==========
  scrollIntoView(pos: Position): void {
    this.cm.scrollIntoView(pos);
  }

  getScrollInfo() {
    const info = this.cm.getScrollInfo();
    return {
      top: info.top,
      left: info.left,
      height: info.height,
      width: info.width,
    };
  }

  // ========== 焦点操作 ==========
  focus(): void {
    this.cm.focus();
  }

  hasFocus(): boolean {
    return this.cm.hasFocus();
  }

  // ========== 事件操作 ==========
  on(event: string, handler: Function): void {
    this.cm.on(event, handler as any);
  }

  off(event: string, handler: Function): void {
    this.cm.off(event, handler as any);
  }

  // ========== 生命周期 ==========
  destroy(): void {
    // CM5 没有原生 destroy，但可以清理事件
    this.cm.getWrapperElement().remove();
  }
}
```

### 2.3 CM6 适配器实现 (`src/core/CM6Adapter.ts`)

```typescript
import type { IEditorAdapter, Position, SelectionRange } from './EditorAdapter';
import { EditorView } from '@codemirror/view';
import { EditorState, EditorSelection } from '@codemirror/state';

export class CM6Adapter implements IEditorAdapter {
  private view: EditorView;

  constructor(view: EditorView) {
    this.view = view;
  }

  // ========== 内容操作 ==========
  getValue(): string {
    return this.view.state.doc.toString();
  }

  setValue(value: string): void {
    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: value },
    });
  }

  getLine(lineNum: number): string {
    const line = this.view.state.doc.line(lineNum + 1); // CM6 行号从 1 开始
    return line.text;
  }

  lineCount(): number {
    return this.view.state.doc.lines;
  }

  // ========== 光标操作 ==========
  getCursor(): Position {
    const pos = this.view.state.selection.main.head;
    const line = this.view.state.doc.lineAt(pos);
    return { line: line.number - 1, ch: pos - line.from };
  }

  setCursor(pos: Position): void {
    const offset = this.posToOffset(pos);
    this.view.dispatch({
      selection: EditorSelection.cursor(offset),
    });
  }

  // ========== 选区操作 ==========
  getSelection(): string {
    const { from, to } = this.view.state.selection.main;
    return this.view.state.sliceDoc(from, to);
  }

  getSelections(): string[] {
    return this.view.state.selection.ranges.map(range =>
      this.view.state.sliceDoc(range.from, range.to)
    );
  }

  setSelection(anchor: Position, head?: Position): void {
    const anchorOffset = this.posToOffset(anchor);
    const headOffset = head ? this.posToOffset(head) : anchorOffset;
    this.view.dispatch({
      selection: EditorSelection.range(anchorOffset, headOffset),
    });
  }

  listSelections(): SelectionRange[] {
    return this.view.state.selection.ranges.map(range => ({
      anchor: this.offsetToPos(range.anchor),
      head: this.offsetToPos(range.head),
    }));
  }

  replaceSelection(text: string): void {
    const { from, to } = this.view.state.selection.main;
    this.view.dispatch({
      changes: { from, to, insert: text },
    });
  }

  replaceSelections(texts: string[]): void {
    const changes = this.view.state.selection.ranges.map((range, i) => ({
      from: range.from,
      to: range.to,
      insert: texts[i] || '',
    }));
    this.view.dispatch({ changes });
  }

  // ========== 范围操作 ==========
  replaceRange(text: string, from: Position, to: Position): void {
    const fromOffset = this.posToOffset(from);
    const toOffset = this.posToOffset(to);
    this.view.dispatch({
      changes: { from: fromOffset, to: toOffset, insert: text },
    });
  }

  findWordAt(pos: Position): SelectionRange {
    const offset = this.posToOffset(pos);
    const line = this.view.state.doc.lineAt(offset);
    const text = line.text;
    const ch = offset - line.from;

    let start = ch;
    let end = ch;

    while (start > 0 && /\w/.test(text[start - 1])) start--;
    while (end < text.length && /\w/.test(text[end])) end++;

    return {
      anchor: { line: line.number - 1, ch: start },
      head: { line: line.number - 1, ch: end },
    };
  }

  // ========== 滚动操作 ==========
  scrollIntoView(pos: Position): void {
    const offset = this.posToOffset(pos);
    this.view.dispatch({
      effects: EditorView.scrollIntoView(offset),
    });
  }

  getScrollInfo() {
    const dom = this.view.scrollDOM;
    return {
      top: dom.scrollTop,
      left: dom.scrollLeft,
      height: dom.scrollHeight,
      width: dom.scrollWidth,
    };
  }

  // ========== 焦点操作 ==========
  focus(): void {
    this.view.focus();
  }

  hasFocus(): boolean {
    return this.view.hasFocus;
  }

  // ========== 事件操作 ==========
  private eventHandlers = new Map<string, Set<Function>>();

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
    // CM6 事件需要通过 updateListener 等扩展实现
  }

  off(event: string, handler: Function): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  // ========== 生命周期 ==========
  destroy(): void {
    this.view.destroy();
    this.eventHandlers.clear();
  }

  // ========== 辅助方法 ==========
  private posToOffset(pos: Position): number {
    const line = this.view.state.doc.line(pos.line + 1);
    return line.from + pos.ch;
  }

  private offsetToPos(offset: number): Position {
    const line = this.view.state.doc.lineAt(offset);
    return { line: line.number - 1, ch: offset - line.from };
  }
}
```

---

## 三、升级步骤

### 步骤 1：创建适配器层（不改变现有行为）

```bash
# 创建适配器目录
mkdir -p src/core

# 复制接口定义
# 创建 CM5Adapter.ts
# 创建 CM6Adapter.ts
```

### 步骤 2：重构 Editor.js 使用适配器

```javascript
// 改动前
class Editor {
  constructor(options) {
    this.editor = CodeMirror(container, cmOptions);
  }
  
  getValue() {
    return this.editor.getValue();
  }
}

// 改动后
class Editor {
  constructor(options) {
    const cm = CodeMirror(container, cmOptions);
    this.adapter = new CM5Adapter(cm);
  }
  
  getValue() {
    return this.adapter.getValue();
  }
}
```

### 步骤 3：运行测试验证

```bash
# 运行所有测试
npm run test

# 重点验证
npm run test -- test/unit/behavior
npm run test -- test/integration
```

### 步骤 4：引入 CM6 并切换

```javascript
// 通过配置切换编辑器引擎
class Editor {
  constructor(options) {
    if (options.engine === 'cm6') {
      const view = new EditorView({ ... });
      this.adapter = new CM6Adapter(view);
    } else {
      const cm = CodeMirror(container, cmOptions);
      this.adapter = new CM5Adapter(cm);
    }
  }
}
```

### 步骤 5：创建 CM6 集成测试

```typescript
// test/integration/codemirror6.spec.ts
// 使用与 codemirror5.spec.ts 相同的测试用例
// 只需更换编辑器初始化方式
```

---

## 四、回归测试数据表

以下是核心编辑操作的输入/输出对照表，升级时必须保持一致：

| 操作 | 输入 | 期望输出 |
|------|------|----------|
| 加粗 | `text` | `**text**` |
| 取消加粗 | `**text**` | `text` |
| 斜体 | `text` | `*text*` |
| 取消斜体 | `*text*` | `text` |
| 删除线 | `text` | `~~text~~` |
| 一级标题 | `Title` | `# Title` |
| 二级标题 | `Title` | `## Title` |
| 三级标题 | `Title` | `### Title` |
| 无序列表 | `item` | `- item` |
| 有序列表 | `item` | `1. item` |
| 任务列表(未选中) | `task` | `- [ ] task` |
| 任务列表(已选中) | `task` | `- [x] task` |
| 引用 | `quote` | `> quote` |
| 链接 | `link` | `[link](url)` |
| 图片 | `alt` | `![alt](image.png)` |

---

## 五、API 对应关系速查

| CM5 API | CM6 等效 | 适配器方法 |
|---------|---------|-----------|
| `cm.getValue()` | `view.state.doc.toString()` | `getValue()` |
| `cm.setValue(v)` | `view.dispatch({ changes: {...} })` | `setValue()` |
| `cm.getLine(n)` | `view.state.doc.line(n+1).text` | `getLine()` |
| `cm.lineCount()` | `view.state.doc.lines` | `lineCount()` |
| `cm.getCursor()` | `view.state.selection.main.head` | `getCursor()` |
| `cm.setCursor(p)` | `view.dispatch({ selection })` | `setCursor()` |
| `cm.getSelection()` | `view.state.sliceDoc(from, to)` | `getSelection()` |
| `cm.replaceSelection(t)` | `view.dispatch({ changes })` | `replaceSelection()` |
| `cm.scrollIntoView(p)` | `EditorView.scrollIntoView` effect | `scrollIntoView()` |
| `cm.focus()` | `view.focus()` | `focus()` |

---

## 六、常见问题

### Q1: 行号差异
- CM5: 行号从 0 开始
- CM6: 行号从 1 开始
- 解决: 适配器内部转换

### Q2: 事件系统差异
- CM5: `cm.on('change', handler)`
- CM6: 使用 `updateListener` 扩展
- 解决: 适配器封装事件映射

### Q3: 装饰/标记差异
- CM5: `markText()` 返回 marker
- CM6: `Decoration` 系统完全不同
- 解决: 可能需要扩展适配器接口

---

## 七、检查清单

升级完成前，确保以下测试全部通过：

- [ ] `npm run test -- test/unit/behavior` (82 项)
- [ ] `npm run test -- test/unit/behavior/editor-adapter.spec.ts` (23 项)
- [ ] `npm run test -- test/integration/codemirror5.spec.ts` (34 项)
- [ ] `npm run test -- test/integration/codemirror6.spec.ts` (34 项，新建)
- [ ] E2E 测试验证用户流程

---

*最后更新: 2026-01-21*
