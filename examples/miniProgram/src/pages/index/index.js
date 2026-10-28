import CherryStream from '@cherry-markdown/miniprogram';
import { createMockMarkdownChunks } from '../../utils/mock-stream.js';

const MARKDOWN_LINE_BREAK = '  ';

const DEMO_MARKDOWN = `# 一级标题（#）

这是普通段落。每一项支持的 Markdown 语法都在下方单独展示。

## 二级标题（##）

### 三级标题（###）

> 引用块（>）可以包含一段文本。

无序列表（-）：

- 第一项
- 第二项

有序列表（1.）：

1. 第一项
2. 第二项

任务列表（- [x] / - [ ]）：

- [x] 已完成任务
- [ ] 待处理任务

表格：

| 能力 | 语法 | 交互 |
| --- | --- | --- |
| 链接 | [原生 text](/pages/index/index) | 点击处理 |
| 图片 | ![logo](/assets/logo-square.png) | 点击预览 |
| 代码块 | 原生 view/text | 点击复制 |

链接：[站内链接](/pages/index/index)

自动链接：https://example.com

图片：![Cherry logo](/assets/logo-square.png)

代码块：

\`\`\`js
const message = 'hello mini program';
console.log(message);
\`\`\`

行内公式：$E=mc^2$

公式块：

$$
a^2 + b^2 = c^2
$$

Mermaid 源码：

\`\`\`mermaid
graph TD;
  A[Cherry Markdown] --> B[HTML];
  B --> C[MiniProgram AST];
  C --> D[Native View];
\`\`\`

加粗：**bold**

斜体：*italic*

行内代码：\`inline code\`

下划线：/underline/

删除线：~~strikethrough~~

下标：^^subscript^^

上标：^superscript^

显式换行：第一行后保留两个空格${MARKDOWN_LINE_BREAK}
第二行

Emoji：:smile:

脚注引用：这是脚注[^demo-footnote]

[^demo-footnote]: 脚注正文会以普通段落输出。
`;

const DEMO_STREAM_INTERVAL = 160;
const MARKDOWN_CHUNKS = createMockMarkdownChunks(DEMO_MARKDOWN);

Page({
  data: {
    markdown: DEMO_MARKDOWN,
    blocks: [],
    streaming: false,
    streamButtonText: '重新流式渲染',
  },

  onLoad() {
    this.cherry = new CherryStream({
      engine: {
        global: {
          flowSessionCursor: 'default',
        },
      },
    });
    this.resetStreamPipeline();
    this.autoStartStream();
  },

  onUnload() {
    this.clearAutoStartTimer();
    this.resetStreamPipeline();
  },

  renderMarkdown(markdown, streaming, callback) {
    this.setData({
      markdown,
      blocks: this.cherry.setMarkdown(markdown, {
        deferImages: !streaming,
        forceNoCursor: !streaming,
      }),
      streaming,
      streamButtonText: streaming ? '流式渲染中' : '重新流式渲染',
    }, callback);
  },

  autoStartStream() {
    this.clearAutoStartTimer();
    this.autoStartTimer = setTimeout(() => {
      this.autoStartTimer = null;
      this.startOrNextStream();
    }, 120);
  },

  startOrNextStream() {
    if (this.data.streaming) {
      return;
    }

    this.resetStreamPipeline();
    this.markdownContent = '';
    this.setData({ streaming: true, streamButtonText: '流式渲染中', markdown: '', blocks: [] }, () => {
      this.pushNextMarkdownChunk();
    });
  },

  pushNextMarkdownChunk() {
    const chunk = MARKDOWN_CHUNKS[this.sseFrameIndex];
    if (!chunk) {
      this.finishStream();
      return;
    }

    this.sseFrameIndex += 1;
    this.markdownContent += chunk;
    this.renderMarkdown(this.markdownContent, true, () => {
      this.scheduleNextSseFrame();
    });
  },

  finishStream() {
    this.clearStreamTimer();
    this.renderMarkdown(this.markdownContent, false);
  },

  scheduleNextSseFrame() {
    this.clearStreamTimer();
    if (!this.data.streaming) {
      return;
    }
    this.streamTimer = setTimeout(() => {
      this.streamTimer = null;
      this.pushNextMarkdownChunk();
    }, DEMO_STREAM_INTERVAL);
  },

  clearStreamTimer() {
    if (this.streamTimer) {
      clearTimeout(this.streamTimer);
      this.streamTimer = null;
    }
  },

  clearAutoStartTimer() {
    if (this.autoStartTimer) {
      clearTimeout(this.autoStartTimer);
      this.autoStartTimer = null;
    }
  },

  resetStreamPipeline() {
    this.clearStreamTimer();
    this.sseFrameIndex = 0;
    this.markdownContent = '';
  },

  resetDemo() {
    this.resetStreamPipeline();
    this.setData({ markdown: '', blocks: [], streaming: false, streamButtonText: '重新流式渲染' }, () => {
      this.autoStartStream();
    });
  },

  copyCode(event) {
    const { text = '' } = event.currentTarget.dataset;
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    });
  },

  previewImage(event) {
    const { src = '' } = event.currentTarget.dataset;
    if (!src) {
      return;
    }
    wx.previewImage({
      current: src,
      urls: [src],
    });
  },

  handleImageLoad() {},

  handleImageError() {},

  handleLinkTap(event) {
    const { href = '' } = event.currentTarget.dataset;
    if (!href) {
      return;
    }

    if (href.startsWith('/pages/')) {
      wx.navigateTo({
        url: href,
        fail: () => wx.showToast({ title: '当前页无需跳转', icon: 'none' }),
      });
      return;
    }

    wx.showModal({
      title: '链接点击',
      content: href,
      confirmText: '复制',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({ data: href });
        }
      },
    });
  },
});
