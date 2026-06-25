/**
 * Mermaid 示例 - 演示如何引入指定版本的 mermaid
 */

// 注册 Mermaid 插件（core 版本需要手动注册）
Cherry.usePlugin(CherryCodeBlockMermaidPlugin, {
  mermaid: window.mermaid,
  mermaidAPI: window.mermaid,
});

// 初始化编辑器
const response = await fetch('./assets/markdown/mermaid.md');
const mdContent = await response.text();

window.cherry = new Cherry({
  id: 'markdown',
  value: mdContent,
  engine: {
    syntax: {
      codeBlock: {
        changeLang: false,
        mermaid: {
          showSourceToolbar: true,
        },
      },
    },
  },
  toolbars: {
    toolbar: [
      'bold',
      'italic',
      'strikethrough',
      '|',
      'header',
      'list',
      '|',
      'code',
      'graph',
      'table',
      '|',
      'undo',
      'redo',
      '|',
      'togglePreview',
    ],
    toolbarRight: ['fullScreen', '|', 'export'],
    sidebar: ['mobilePreview', 'copy', 'theme', 'codeTheme'],
    toc: {
      defaultModel: 'full',
    },
  },
});