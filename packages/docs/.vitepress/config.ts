import { DefaultTheme, defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  ignoreDeadLinks: true,
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
    nav: nav(),
    sidebar: {
      '/cherry/': { base: '/cherry/', items: sideGuide() },
      '/cherry-client/': { base: '/cherry-client/', items: sideCherryClient() },
      '/cherry-vscode-plugin/': { base: '/cherry-vscode-plugin/', items: sideCherryVscodePlugin() }
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Tencent/cherry-markdown' }
    ]
  }
})

function nav(): DefaultTheme.NavItem[] {
  return [
    {
      text: '介绍',
      link: '/cherry/guide/introduction',
      activeMatch: '/guide/'
    },
    {
      text: 'PC 客户端',
      link: '/cherry-client/guide/introduction',
      activeMatch: '/cherry-client/'
    },
    {
      text: 'VsCode 插件',
      link: '/cherry-vscode-plugin/guide/introduction',
      activeMatch: '/cherry-vscode-plugin'
    },
  ]
}

function sideGuide(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: '指导',
      base: '/cherry/guide/',
      items: [
        { text: '介绍', link: 'introduction' },
        { text: '开始使用', link: 'getting-started' },
        { text: '语法特性', link: 'features' },
        { text: '快速预览', link: 'examples' },
      ]
    },
    {
      text: '配置',
      base: '/cherry/configuration/',
      items: [
        { text: '基础配置', link: 'base' },
        { text: '快速配置', link: 'quick-configuration' },
        { text: '拓展配置', link: 'extensions' },
      ]
    },
    {
      text: '功能',
      base: '/cherry/operation/',
      items: [
        { text: 'API操作', link: 'api' },
      ]
    }, {
      text: '高级功能',
      base: '/cherry/advanced/',
      items: [
        { text: '自定义语法', link: 'custom-render' },
      ]
    }
  ]
}

function sideCherryClient(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: '客户端',
      base: '/cherry-client/guide/',
      items: [
        { text: '介绍', link: 'introduction' },
      ]
    },
  ]
}

function sideCherryVscodePlugin(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'VsCode 插件',
      base: '/cherry-vscode-plugin/guide/',
      items: [
        { text: '介绍', link: 'introduction' },
      ]
    },
  ]
}
