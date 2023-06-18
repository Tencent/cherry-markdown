import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  ignoreDeadLinks:true,
  title: "Cherry Markdown Editor",
  description: "一个具有开箱即用、轻量级、易于扩展等优点的Javascript Markdown 编辑器。",
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo/cherry-markdown-logo.svg' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/logo/cherry-markdown-logo.png' }],

    [
      'meta',
      { name: 'Cherry Markdown Editor', content: '一个具有开箱即用、轻量级、易于扩展等优点的Javascript Markdown 编辑器。' },
    ],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    // 客户端 客户端最新下载地址
    // Vscode插件 地址
    nav: [
      { text: '介绍', link: '/guide/introduction' },
      {
        text: '其他', items: [
          // {
          //   text: '客户端',
          //   link: 'https://github.com/Tencent/cherry-markdown/tree/main/client'
          // },
          {
            text: 'Vscode 插件',
            link: 'https://marketplace.visualstudio.com/items?itemName=cherryMarkdownPublisher.cherry-markdown'
          }
        ]
      },
    ],
    sidebar: [
      {
        text: '指导',
        items: [
          { text: '介绍', link: '/guide/introduction' },
          { text: '开始使用', link: '/guide/getting-started' },
          { text: '语法特性', link: '/guide/features' },
          { text: '快速预览', link: '/guide/examples' },
        ]
      },
      {
        text: '配置',
        items: [
          { text: '基础配置', link: '/configuration/base' },
          { text: '快速配置', link: '/configuration/quick-configuration' },
          { text: '拓展配置', link: '/configuration/extensions' }, 
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Tencent/cherry-markdown' }
    ]
  }
})
