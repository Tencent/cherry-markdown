/**
 * Cherry Markdown 视觉回归测试
 *
 * 用途：CM5 → CM6 升级时，确保编辑器的视觉表现完全一致。
 *
 * 使用方式：
 *   1. CM5 版本下运行：npx playwright test --update-snapshots  → 生成基准截图
 *   2. CM6 升级后运行：npx playwright test                     → 自动像素级比对
 *   3. 差异超阈值则测试失败，并生成 expected/actual/diff 三张对比图
 */
import { test, expect, Page } from '@playwright/test';

// ============================================================================
// 辅助函数
// ============================================================================

/** 等待 Cherry 编辑器完全加载 */
async function waitForCherryReady(page: Page) {
  // 等待编辑器 DOM 出现
  await page.waitForSelector('.cherry', { timeout: 10000 });
  // 等待 CodeMirror 编辑区域渲染完成
  await page.waitForSelector('.CodeMirror-code, .cm-content', { timeout: 10000 });
  // 额外等待渲染稳定
  await page.waitForTimeout(500);
}

/** 获取编辑器的可编辑区域 */
function getEditorArea(page: Page) {
  // CM5: .CodeMirror-code, CM6: .cm-content
  return page.locator('.CodeMirror-code, .cm-content').first();
}

/** 获取编辑器容器 */
function getEditorContainer(page: Page) {
  // CM5: .CodeMirror, CM6: .cm-editor
  return page.locator('.CodeMirror, .cm-editor').first();
}

/** 获取预览区域 */
function getPreviewArea(page: Page) {
  return page.locator('.cherry-previewer').first();
}

/** 清空编辑器并输入新内容 */
async function setEditorContent(page: Page, content: string) {
  // 使用 Cherry API 设置内容
  await page.evaluate((text) => {
    (window as any).cherry.setValue(text);
  }, content);
  await page.waitForTimeout(300);
}

/** 点击编辑器获得焦点 */
async function focusEditor(page: Page) {
  const editor = getEditorArea(page);
  await editor.click();
  await page.waitForTimeout(200);
}

// ============================================================================
// 测试套件
// ============================================================================

test.describe('Cherry Markdown 视觉回归测试', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForCherryReady(page);
  });

  // ==========================================================================
  // 1. Markdown 渲染视觉测试
  // ==========================================================================

  test.describe('Markdown 渲染', () => {

    test('标题渲染（H1-H6）', async ({ page }) => {
      await setEditorContent(page, [
        '# 一级标题',
        '## 二级标题',
        '### 三级标题',
        '#### 四级标题',
        '##### 五级标题',
        '###### 六级标题',
      ].join('\n'));

      const preview = getPreviewArea(page);
      await expect(preview).toHaveScreenshot('heading-h1-h6.png');
    });

    test('加粗文字渲染', async ({ page }) => {
      await setEditorContent(page, [
        '这是普通文字',
        '',
        '这是**加粗文字**的效果',
        '',
        '**整行加粗**',
        '',
        '混合**加粗**和普通文字以及**多处加粗**',
      ].join('\n'));

      const preview = getPreviewArea(page);
      await expect(preview).toHaveScreenshot('bold-text.png');
    });

    test('斜体文字渲染', async ({ page }) => {
      await setEditorContent(page, [
        '这是普通文字',
        '',
        '这是*斜体文字*的效果',
        '',
        '*整行斜体*',
        '',
        '混合*斜体*和普通文字以及*多处斜体*',
      ].join('\n'));

      const preview = getPreviewArea(page);
      await expect(preview).toHaveScreenshot('italic-text.png');
    });

    test('加粗+斜体组合渲染', async ({ page }) => {
      await setEditorContent(page, [
        '***加粗斜体***',
        '',
        '**加粗**和*斜体*混合',
        '',
        '这里有***加粗斜体***和**仅加粗**和*仅斜体*',
      ].join('\n'));

      const preview = getPreviewArea(page);
      await expect(preview).toHaveScreenshot('bold-italic-combined.png');
    });

    test('删除线渲染', async ({ page }) => {
      await setEditorContent(page, [
        '这是~~删除线~~效果',
        '',
        '~~整行删除线~~',
        '',
        '普通文字和~~删除线~~混合',
      ].join('\n'));

      const preview = getPreviewArea(page);
      await expect(preview).toHaveScreenshot('strikethrough-text.png');
    });

    test('代码块渲染', async ({ page }) => {
      await setEditorContent(page, [
        '行内代码 `const x = 1` 效果',
        '',
        '```javascript',
        'function hello() {',
        '  console.log("Hello World");',
        '  return 42;',
        '}',
        '```',
      ].join('\n'));

      const preview = getPreviewArea(page);
      await expect(preview).toHaveScreenshot('code-block.png');
    });

    test('列表渲染（有序+无序）', async ({ page }) => {
      await setEditorContent(page, [
        '无序列表：',
        '- 项目一',
        '- 项目二',
        '  - 子项目 A',
        '  - 子项目 B',
        '- 项目三',
        '',
        '有序列表：',
        '1. 第一步',
        '2. 第二步',
        '   1. 子步骤 A',
        '   2. 子步骤 B',
        '3. 第三步',
      ].join('\n'));

      const preview = getPreviewArea(page);
      await expect(preview).toHaveScreenshot('list-ordered-unordered.png');
    });

    test('表格渲染', async ({ page }) => {
      await setEditorContent(page, [
        '| 姓名 | 年龄 | 城市 |',
        '| --- | --- | --- |',
        '| 张三 | 25 | 北京 |',
        '| 李四 | 30 | 上海 |',
        '| 王五 | 28 | 广州 |',
      ].join('\n'));

      const preview = getPreviewArea(page);
      await expect(preview).toHaveScreenshot('table.png');
    });

    test('引用块渲染', async ({ page }) => {
      await setEditorContent(page, [
        '> 这是一段引用',
        '> ',
        '> 引用中的**加粗**和*斜体*',
        '',
        '> 嵌套引用：',
        '>> 二级引用内容',
      ].join('\n'));

      const preview = getPreviewArea(page);
      await expect(preview).toHaveScreenshot('blockquote.png');
    });

    test('综合 Markdown 渲染', async ({ page }) => {
      await setEditorContent(page, [
        '# Cherry Markdown 综合渲染测试',
        '',
        '## 文字格式',
        '普通文字、**加粗**、*斜体*、***加粗斜体***、~~删除线~~、`行内代码`',
        '',
        '## 列表',
        '- 项目一',
        '- 项目二',
        '',
        '## 表格',
        '| 列A | 列B |',
        '| --- | --- |',
        '| 1 | 2 |',
        '',
        '## 代码',
        '```js',
        'console.log("test");',
        '```',
        '',
        '> 引用内容',
      ].join('\n'));

      const preview = getPreviewArea(page);
      await expect(preview).toHaveScreenshot('comprehensive-render.png');
    });
  });

  // ==========================================================================
  // 2. 编辑器内文字选区视觉测试
  // ==========================================================================

  test.describe('文字选区', () => {

    test('全选文字高亮', async ({ page }) => {
      await setEditorContent(page, [
        '# 标题',
        '',
        '这是第一行文字',
        '这是第二行文字',
        '这是第三行文字',
      ].join('\n'));

      await focusEditor(page);
      // 全选
      await page.keyboard.press('Meta+A');
      await page.waitForTimeout(300);

      const editor = getEditorContainer(page);
      await expect(editor).toHaveScreenshot('select-all.png');
    });

    test('选择多行文字高亮', async ({ page }) => {
      await setEditorContent(page, [
        '第一行内容',
        '第二行内容',
        '第三行内容',
        '第四行内容',
        '第五行内容',
      ].join('\n'));

      await focusEditor(page);

      // 光标移到开头
      await page.keyboard.press('Meta+Home');
      await page.waitForTimeout(100);

      // Shift+Down 选择多行
      await page.keyboard.press('Shift+ArrowDown');
      await page.keyboard.press('Shift+ArrowDown');
      await page.keyboard.press('Shift+ArrowDown');
      await page.waitForTimeout(300);

      const editor = getEditorContainer(page);
      await expect(editor).toHaveScreenshot('select-multiple-lines.png');
    });

    test('选择单词高亮', async ({ page }) => {
      await setEditorContent(page, 'Hello World Test Content');

      await focusEditor(page);

      // 光标移到开头
      await page.keyboard.press('Meta+Home');
      await page.waitForTimeout(100);

      // 双击选中第一个单词
      const editorArea = getEditorArea(page);
      await editorArea.dblclick({ position: { x: 30, y: 10 } });
      await page.waitForTimeout(300);

      const editor = getEditorContainer(page);
      await expect(editor).toHaveScreenshot('select-word.png');
    });
  });

  // ==========================================================================
  // 3. 工具栏操作后的视觉测试
  // ==========================================================================

  test.describe('工具栏操作', () => {

    test('通过工具栏加粗 — 编辑器视觉', async ({ page }) => {
      await setEditorContent(page, '这段文字需要加粗');

      await focusEditor(page);
      // 全选
      await page.keyboard.press('Meta+A');
      await page.waitForTimeout(200);

      // 点击工具栏加粗按钮
      const boldBtn = page.locator('.cherry-toolbar [data-toolbar-type="bold"]').first();
      if (await boldBtn.isVisible()) {
        await boldBtn.click();
      } else {
        // 降级用快捷键
        await page.keyboard.press('Meta+B');
      }
      await page.waitForTimeout(300);

      // 编辑器中应显示 **文字**
      const editor = getEditorContainer(page);
      await expect(editor).toHaveScreenshot('toolbar-bold-editor.png');

      // 预览区应显示加粗效果
      const preview = getPreviewArea(page);
      await expect(preview).toHaveScreenshot('toolbar-bold-preview.png');
    });

    test('通过工具栏斜体 — 编辑器视觉', async ({ page }) => {
      await setEditorContent(page, '这段文字需要斜体');

      await focusEditor(page);
      await page.keyboard.press('Meta+A');
      await page.waitForTimeout(200);

      // 点击工具栏斜体按钮
      const italicBtn = page.locator('.cherry-toolbar [data-toolbar-type="italic"]').first();
      if (await italicBtn.isVisible()) {
        await italicBtn.click();
      } else {
        await page.keyboard.press('Meta+I');
      }
      await page.waitForTimeout(300);

      const editor = getEditorContainer(page);
      await expect(editor).toHaveScreenshot('toolbar-italic-editor.png');

      const preview = getPreviewArea(page);
      await expect(preview).toHaveScreenshot('toolbar-italic-preview.png');
    });

    test('通过快捷键加粗 — 编辑器视觉', async ({ page }) => {
      await setEditorContent(page, '快捷键加粗测试');

      await focusEditor(page);
      await page.keyboard.press('Meta+A');
      await page.waitForTimeout(200);
      await page.keyboard.press('Meta+B');
      await page.waitForTimeout(300);

      const editor = getEditorContainer(page);
      await expect(editor).toHaveScreenshot('shortcut-bold-editor.png');

      const preview = getPreviewArea(page);
      await expect(preview).toHaveScreenshot('shortcut-bold-preview.png');
    });

    test('通过快捷键斜体 — 编辑器视觉', async ({ page }) => {
      await setEditorContent(page, '快捷键斜体测试');

      await focusEditor(page);
      await page.keyboard.press('Meta+A');
      await page.waitForTimeout(200);
      await page.keyboard.press('Meta+I');
      await page.waitForTimeout(300);

      const editor = getEditorContainer(page);
      await expect(editor).toHaveScreenshot('shortcut-italic-editor.png');

      const preview = getPreviewArea(page);
      await expect(preview).toHaveScreenshot('shortcut-italic-preview.png');
    });
  });

  // ==========================================================================
  // 4. 编辑器整体布局视觉测试
  // ==========================================================================

  test.describe('编辑器布局', () => {

    test('默认布局 — 编辑+预览', async ({ page }) => {
      await setEditorContent(page, [
        '# 布局测试',
        '',
        '左侧编辑，右侧预览。',
        '',
        '**加粗**、*斜体*、`代码`',
      ].join('\n'));

      const cherry = page.locator('.cherry').first();
      await expect(cherry).toHaveScreenshot('layout-edit-preview.png');
    });

    test('工具栏视觉', async ({ page }) => {
      const toolbar = page.locator('.cherry-toolbar').first();
      await expect(toolbar).toHaveScreenshot('toolbar.png');
    });
  });

  // ==========================================================================
  // 5. 编辑器内语法高亮视觉测试（编辑区，非预览区）
  // ==========================================================================

  test.describe('编辑区语法高亮', () => {

    test('Markdown 语法高亮 — 标题', async ({ page }) => {
      await setEditorContent(page, [
        '# 一级标题',
        '## 二级标题',
        '### 三级标题',
        '',
        '普通段落文字',
      ].join('\n'));

      await focusEditor(page);
      await page.waitForTimeout(300);

      const editor = getEditorContainer(page);
      await expect(editor).toHaveScreenshot('syntax-highlight-headings.png');
    });

    test('Markdown 语法高亮 — 加粗/斜体标记', async ({ page }) => {
      await setEditorContent(page, [
        '普通文字 **加粗文字** 普通文字',
        '',
        '普通文字 *斜体文字* 普通文字',
        '',
        '普通文字 ***加粗斜体*** 普通文字',
      ].join('\n'));

      await focusEditor(page);
      await page.waitForTimeout(300);

      const editor = getEditorContainer(page);
      await expect(editor).toHaveScreenshot('syntax-highlight-emphasis.png');
    });

    test('Markdown 语法高亮 — 代码块', async ({ page }) => {
      await setEditorContent(page, [
        '行内 `code` 效果',
        '',
        '```javascript',
        'const x = 42;',
        'function test() {}',
        '```',
      ].join('\n'));

      await focusEditor(page);
      await page.waitForTimeout(300);

      const editor = getEditorContainer(page);
      await expect(editor).toHaveScreenshot('syntax-highlight-code.png');
    });

    test('Markdown 语法高亮 — 引用块中的链接', async ({ page }) => {
      // 这个测试专门验证 CM5 和 CM6 对引用块中链接的渲染一致性
      // CM5: > 是 cm-quote 颜色，链接是 cm-link 颜色，URL 是 cm-url 颜色
      // CM6: 需要确保相同的颜色分布
      await setEditorContent(page, [
        '> [Github 地址](https://github.com/Tencent/cherry-markdown){target=_blank}',
        '',
        '> 普通引用文字',
        '',
        '> 引用中的 [链接](https://example.com) 和 **加粗**',
      ].join('\n'));

      await focusEditor(page);
      await page.waitForTimeout(300);

      const editor = getEditorContainer(page);
      await expect(editor).toHaveScreenshot('syntax-highlight-blockquote-link.png');
    });

    test('Markdown 语法高亮 — 链接', async ({ page }) => {
      await setEditorContent(page, [
        '[普通链接](https://example.com)',
        '',
        '[带标题的链接](https://example.com "链接标题")',
        '',
        '<https://auto.link.com>',
        '',
        '文字中的 [内嵌链接](https://example.com) 效果',
      ].join('\n'));

      await focusEditor(page);
      await page.waitForTimeout(300);

      const editor = getEditorContainer(page);
      await expect(editor).toHaveScreenshot('syntax-highlight-links.png');
    });

    test('Markdown 语法高亮 — 列表', async ({ page }) => {
      await setEditorContent(page, [
        '- 无序列表项 1',
        '- 无序列表项 2',
        '  - 嵌套项',
        '',
        '1. 有序列表项 1',
        '2. 有序列表项 2',
      ].join('\n'));

      await focusEditor(page);
      await page.waitForTimeout(300);

      const editor = getEditorContainer(page);
      await expect(editor).toHaveScreenshot('syntax-highlight-lists.png');
    });
  });
});
