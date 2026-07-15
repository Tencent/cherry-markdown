const miniProgramModule = require('../../vendor/cherry-mini-program-stream');
const MiniProgramStream = miniProgramModule.default || miniProgramModule;

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

<table><tr><td>Unsupported HTML fallback</td></tr></table>
`;

const STREAM_CHUNKS = [
  '# Stream Demo\n\n',
  '正在模拟流式输出：',
  '**bold** ',
  '*italic* ',
  '[link](/pages/index/index)\n\n',
  '```js\n',
  'wx.setClipboardData({ data: code });\n',
  '```\n\n',
  '![preview](../../assets/logo-square.png)\n',
  '\n图片之后继续输出，确认 stream 没有被 image 阻塞。',
];

const DEMO_STREAM_INTERVAL = 160;

function scheduleNextFlush(callback) {
  if (typeof wx !== 'undefined' && typeof wx.nextTick === 'function') {
    wx.nextTick(callback);
    return;
  }

  Promise.resolve().then(callback);
}

const INLINE_CLASS = {
  strong: 'md-strong',
  em: 'md-em',
  code: 'md-inline-code',
  underline: 'md-underline',
  strikethrough: 'md-strike',
  sub: 'md-sub',
  sup: 'md-sup',
};

function joinClass(...classes) {
  return classes.filter(Boolean).join(' ');
}

function flattenInlineNodes(nodes = [], className = '', href = '') {
  return nodes.reduce((runs, node) => {
    if (!node) {
      return runs;
    }

    if (node.type === 'text') {
      if (node.text) {
        runs.push({ type: href ? 'link' : 'text', text: node.text, className, href });
      }
      return runs;
    }

    if (node.type === 'break') {
      runs.push({ type: 'text', text: '\n', className, href });
      return runs;
    }

    if (node.type === 'cursor') {
      runs.push({ type: 'cursor' });
      return runs;
    }

    if (node.type === 'image') {
      runs.push({ type: 'image', src: '', pendingSrc: node.src, alt: node.alt || '' });
      return runs;
    }

    if (node.type === 'link') {
      return runs.concat(flattenInlineNodes(node.children || [], joinClass(className, 'md-link'), node.href || ''));
    }

    return runs.concat(flattenInlineNodes(node.children || [], joinClass(className, INLINE_CLASS[node.type]), href));
  }, []);
}

function blocksToInlineRuns(blocks = []) {
  return blocks.reduce((runs, block, index) => {
    if (index > 0) {
      runs.push({ type: 'text', text: '\n' });
    }

    if (block.type === 'paragraph' || block.type === 'heading') {
      return runs.concat(flattenInlineNodes(block.children || []));
    }

    if (block.type === 'code_block') {
      runs.push({ type: 'text', text: block.text || '', className: 'md-inline-code' });
      return runs;
    }

    if (block.type === 'image') {
      runs.push({ type: 'image', src: '', pendingSrc: block.src, alt: block.alt || '' });
      return runs;
    }

    if (block.type === 'list') {
      block.children.forEach((item, itemIndex) => {
        if (runs.length > 0) {
          runs.push({ type: 'text', text: '\n' });
        }
        runs.push({ type: 'text', text: `${block.ordered ? `${itemIndex + 1}.` : '•'} ` });
        runs.push(...blocksToInlineRuns(item.children || []));
      });
    }

    return runs;
  }, []);
}

function toViewBlocks(blocks = []) {
  return blocks.map((block) => {
    if (block.type === 'paragraph') {
      return { type: 'paragraph', inlines: flattenInlineNodes(block.children || []) };
    }

    if (block.type === 'heading') {
      return { type: 'heading', level: block.level, inlines: flattenInlineNodes(block.children || []) };
    }

    if (block.type === 'blockquote') {
      return { type: 'blockquote', children: toViewBlocks(block.children || []) };
    }

    if (block.type === 'list') {
      return {
        type: 'list',
        ordered: block.ordered,
        children: (block.children || []).map((item) => ({ inlines: blocksToInlineRuns(item.children || []) })),
      };
    }

    if (block.type === 'code_block') {
      return { type: 'code_block', lang: block.lang || 'text', text: block.text || '' };
    }

    if (block.type === 'image') {
      return { type: 'image', src: '', pendingSrc: block.src, alt: block.alt || '' };
    }

    return block;
  });
}

Page({
  data: {
    markdown: DEMO_MARKDOWN,
    blocks: [],
    streaming: false,
  },

  onLoad() {
    this.stream = new MiniProgramStream({
      engine: {
        syntax: {
          header: {
            anchorStyle: 'none',
          },
        },
      },
    });
    this.resetStreamPipeline();
    this.renderMarkdown(DEMO_MARKDOWN);
  },

  onUnload() {
    this.resetStreamPipeline();
  },

  renderMarkdown(markdown, callback) {
    const blocks = toViewBlocks(this.stream.setMarkdown(markdown));
    this.setData({
      markdown,
      blocks,
    }, () => {
      this.activatePendingImages(callback);
    });
  },

  activatePendingImages(callback) {
    const blocks = this.data.blocks || [];
    const nextBlocks = this.resolvePendingImages(blocks);
    if (nextBlocks === blocks) {
      if (callback) callback();
      return;
    }

    this.setData({ blocks: nextBlocks }, callback);
  },

  resolvePendingImages(blocks = []) {
    let changed = false;
    const nextBlocks = blocks.map((block) => {
      if (block.type === 'image' && !block.src && block.pendingSrc) {
        changed = true;
        return { ...block, src: block.pendingSrc };
      }

      if (block.inlines) {
        let inlineChanged = false;
        const inlines = block.inlines.map((item) => {
          if (item.type === 'image' && !item.src && item.pendingSrc) {
            changed = true;
            inlineChanged = true;
            return { ...item, src: item.pendingSrc };
          }
          return item;
        });
        return inlineChanged ? { ...block, inlines } : block;
      }

      if (block.children) {
        const children = this.resolvePendingImages(block.children);
        if (children !== block.children) {
          changed = true;
          return { ...block, children };
        }
      }

      return block;
    });

    return changed ? nextBlocks : blocks;
  },

  startStream() {
    this.resetStreamPipeline();
    this.setData({ streaming: true, markdown: '', blocks: [] });

    this.produceDemoChunk(0);
  },

  produceDemoChunk(index) {
    const chunk = STREAM_CHUNKS[index];
    if (!chunk) {
      this.isProducingStream = false;
      this.flushStreamQueue();
      return;
    }

    this.isProducingStream = true;
    this.enqueueStreamChunk(chunk);
    this.demoStreamTimer = setTimeout(() => this.produceDemoChunk(index + 1), DEMO_STREAM_INTERVAL);
  },

  enqueueStreamChunk(chunk) {
    this.streamQueue.push(chunk);
    this.flushStreamQueue();
  },

  flushStreamQueue() {
    if (this.isFlushingStream) {
      return;
    }

    const chunk = this.streamQueue.shift();
    if (!chunk) {
      if (!this.isProducingStream) {
        this.setData({ streaming: false });
      }
      return;
    }

    this.isFlushingStream = true;
    this.streamMarkdown += chunk;

    this.renderMarkdown(this.streamMarkdown, () => {
      this.isFlushingStream = false;
      scheduleNextFlush(() => this.flushStreamQueue());
    });
  },

  resetStreamPipeline() {
    if (this.demoStreamTimer) {
      clearTimeout(this.demoStreamTimer);
      this.demoStreamTimer = null;
    }
    this.streamQueue = [];
    this.streamMarkdown = '';
    this.isFlushingStream = false;
    this.isProducingStream = false;
  },

  resetDemo() {
    this.resetStreamPipeline();
    this.setData({ streaming: false });
    this.renderMarkdown(DEMO_MARKDOWN);
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

  handleImageLoad(event) {
    console.info('image loaded', event.currentTarget.dataset.src);
  },

  handleImageError(event) {
    console.warn('image load failed', event.currentTarget.dataset.src, event.detail);
  },

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
