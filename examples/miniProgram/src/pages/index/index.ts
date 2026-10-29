import type { NativeMarkdownHandle } from '@cherry-markdown/miniprogram';
import { createMockMarkdownChunks } from '../../utils/mock-stream';

interface DemoPage {
  data: { theme: string };
  setData(patch: { theme: string }): void;
  timer?: ReturnType<typeof setTimeout>;
  chunks: string[];
  position: number;
  content: string;
  renderer?: NativeMarkdownHandle;
  selectComponent(selector: string): NativeMarkdownHandle;
  resetDemo(): void;
  pushChunk(): void;
}
declare function Page(options: object): void;
declare const wx: {
  setClipboardData(options: { data: string }): void;
};

const DEMO_MARKDOWN = `# Cherry Markdown MiniProgram

这是一个 **微信小程序原生渲染** 示例，支持 *基础语法*、\`inline code\` 和 [链接点击](/pages/index/index)。

> 这里是 blockquote，可以继续渲染子块。

- 无序列表
- 图片预览
- 代码复制
  - 嵌套列表保留结构
    - 第三级列表

---

![Cherry logo](/assets/logo-square.png)

\`\`\`js
const message = 'hello mini program';
console.log(message);
\`\`\`

## Cherry 扩展与主题

!!#c0392b 共享颜色语法!! 和 !24 原生字号!。

:::tip 原生信息面板
面板、颜色与字号直接来自 Cherry 共享语义。
:::

+++ 点击展开详情
这是原生展开收起内容，支持 **加粗** 和链接。
+++

## 更多基础语法

1. 有序列表
2. ~~删除线~~ 和 **加粗** 可以组合测试
3. 任务列表和表格会转换为原生 view 渲染

- [x] 已完成任务
- [ ] 待处理任务

| 能力 | 渲染方式 | 交互 |
| --- | --- | --- |
| 链接 | [原生 text](/pages/index/index) | 点击处理 |
| 图片 | ![logo](/assets/logo-square.png) | 点击预览 |
| 代码块 | 原生 view/text | 点击复制 |
| 表格 | 原生 view | 单元格内链接/图片保留交互 |

## 公式与图表源码

行内公式：$E=mc^2$ 会转换为 math_inline run。

$$
a^2 + b^2 = c^2
$$

\`\`\`mermaid
graph TD;
  A[Markdown] --> B[Semantic Blocks];
  B --> C[Native Components];
\`\`\`
`;

Page({
  data: { theme: 'default' },
  toggleTheme(this: DemoPage) {
    this.setData({ theme: this.data.theme === 'dark' ? 'default' : 'dark' });
  },
  chunks: [],
  position: 0,
  content: '',
  onReady(this: DemoPage) {
    this.renderer = this.selectComponent('#markdown');
    this.resetDemo();
  },
  onUnload(this: DemoPage) {
    if (this.timer) clearTimeout(this.timer);
  },
  resetDemo(this: DemoPage) {
    if (this.timer) clearTimeout(this.timer);
    this.chunks = createMockMarkdownChunks(DEMO_MARKDOWN);
    this.position = 0;
    this.content = '';
    this.renderer?.setMarkdown('', true);
    this.pushChunk();
  },
  pushChunk(this: DemoPage) {
    this.content += this.chunks.slice(this.position, this.position + 8).join('');
    this.position += 8;
    const streaming = this.position < this.chunks.length;
    this.renderer?.setMarkdown(this.content, streaming);
    if (streaming) this.timer = setTimeout(() => this.pushChunk(), 20);
  },
  handleLinkTap(event: { detail: { href: string } }) {
    wx.setClipboardData({ data: event.detail.href });
  },
});
