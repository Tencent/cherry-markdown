const miniProgramModule = require('../../vendor/cherry-mini-program-stream');
const { createMiniProgramSseFrames, createMiniProgramStreamAdapter, createSseParser } = miniProgramModule;

const DEMO_MARKDOWN = `# Cherry Markdown MiniProgram

这是一个 **微信小程序原生渲染** 示例，支持 *基础语法*、\`inline code\` 和 [链接点击](/pages/index/index)。

> 这里是 blockquote，可以继续渲染子块。

- 无序列表
- 图片预览
- 代码复制

![Cherry logo](../../assets/logo-square.png)

\`\`\`js
const message = 'hello mini program';
console.log(message);
\`\`\`

## 更多基础语法

1. 有序列表
2. ~~删除线~~ 和 **加粗** 可以组合测试
3. 任务列表和表格会转换为原生 view 渲染

- [x] 已完成任务
- [ ] 待处理任务

| 能力 | 渲染方式 | 交互 |
| --- | --- | --- |
| 链接 | [原生 text](/pages/index/index) | 点击处理 |
| 图片 | ![logo](../../assets/logo-square.png) | 点击预览 |
| 代码块 | 原生 view/text | 点击复制 |
| 表格 | 原生 view | 单元格内链接/图片保留交互 |

## 公式与图表源码 fallback

行内公式：$E=mc^2$ 会转换为 math_inline run。

$$
a^2 + b^2 = c^2
$$

\`\`\`mermaid
graph TD;
  A[Cherry Markdown] --> B[HTML];
  B --> C[MiniProgram AST];
  C --> D[Native View];
\`\`\`
`;

const DEMO_STREAM_INTERVAL = 60;
const SSE_FRAMES = createMiniProgramSseFrames(DEMO_MARKDOWN);

Page({
  data: {
    markdown: DEMO_MARKDOWN,
    blocks: [],
    streaming: false,
    streamButtonText: '重新流式渲染',
  },

  onLoad() {
    this.streamAdapter = createMiniProgramStreamAdapter({
      imagePlaceholderText: '图片链接解析中',
    });
    this.sseParser = createSseParser({
      onMessage: (event) => this.handleSseMessage(event),
      onDone: () => this.finishStream(),
    });
    this.resetStreamPipeline();
    this.autoStartStream();
  },

  onUnload() {
    this.clearAutoStartTimer();
    this.resetStreamPipeline();
  },

  applyStreamState(state, callback) {
    if (!state) {
      if (callback) callback();
      return;
    }
    this.setData({
      markdown: state.markdown,
      blocks: state.blocks,
      streaming: state.streaming,
      streamButtonText: state.streaming ? '流式渲染中' : '重新流式渲染',
    }, callback);
  },

  renderMarkdown(markdown, callback) {
    this.applyStreamState(this.streamAdapter.setMarkdown(markdown), callback);
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
    this.setData({ streaming: true, streamButtonText: '流式渲染中', markdown: '', blocks: [] }, () => {
      this.pushNextSseFrame();
    });
  },

  pushNextSseFrame() {
    const frame = SSE_FRAMES[this.sseFrameIndex];
    if (!frame) {
      this.finishStream();
      return;
    }

    this.sseFrameIndex += 1;
    this.sseParser.push(frame);
  },

  handleSseMessage(event) {
    this.applyStreamState(this.streamAdapter.appendSseEvent(event), () => {
      this.scheduleNextSseFrame();
    });
  },

  finishStream() {
    this.clearStreamTimer();
    this.applyStreamState(this.streamAdapter.finish());
  },

  scheduleNextSseFrame() {
    this.clearStreamTimer();
    if (!this.data.streaming) {
      return;
    }
    this.streamTimer = setTimeout(() => {
      this.streamTimer = null;
      this.pushNextSseFrame();
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
    if (this.streamAdapter) {
      this.streamAdapter.reset();
    }
    if (this.sseParser) {
      this.sseParser.reset();
    }
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
