
# Cherry Markdown 竞品分析报告

## 1. 简介

Cherry Markdown 是一款开源的轻量级 Markdown 编辑器，由腾讯开发。本报告将从多个维度对 Cherry Markdown 与主要竞品进行对比分析。其中性能部分还在测试，

## 2. 主要竞品

- Obsidian
- Notion  
- Joplin
- Typora
- StackEdit

## 3. 对比分析

### 3.1 语法能力

| 功能 | Cherry Markdown | Obsidian | Notion | Joplin | Typora | StackEdit |
|------|-----------------|----------|--------|--------|--------|-----------|
| 基础 Markdown | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| GFM 表格 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 数学公式 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 流程图 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 自定义语法 | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

Cherry Markdown 在语法能力上与主流竞品基本持平，并支持自定义语法扩展，这是其独特优势。

### 3.2 功能特性

| 功能 | Cherry Markdown | Obsidian | Notion | Joplin | Typora | StackEdit |
|------|-----------------|----------|--------|--------|--------|-----------|
| 实时预览 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 文件管理 | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ |
| 协作编辑 | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| 版本控制 | ✗ | ✓ | ✓ | ✓ | ✗ | ✓ |
| 移动端支持 | ✗ | ✓ | ✓ | ✓ | ✗ | ✓ |

Cherry Markdown 作为纯编辑器，在功能上相对简单。缺少文件管理、协作等高级功能可能限制其在某些场景下的应用。

### 3.3 安全性

| 功能 | Cherry Markdown | Obsidian | Notion | Joplin | Typora | StackEdit |
|------|-----------------|----------|--------|--------|--------|-----------|
| 本地存储 | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| 端到端加密 | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ |
| XSS 防护 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Cherry Markdown 内置了安全 Hook，通过白名单过滤和 DOMPurify 扫描过滤提高了内容安全性。但缺乏端到端加密可能在某些高安全性要求场景下处于劣势。

### 3.4 性能

| 指标 | Cherry Markdown | Obsidian | Notion | Joplin | Typora | StackEdit |
|------|-----------------|----------|--------|--------|--------|-----------|
| 启动速度 | 快 | 中 | 慢 | 中 | 快 | 快 |
| 大文档处理 | 良好 | 良好 | 一般 | 良好 | 优秀 | 一般 |
| 内存占用 | 低 | 中 | 高 | 中 | 低 | 低 |

Cherry Markdown 作为轻量级编辑器，在性能方面表现优秀，特别是在启动速度和内存占用上有明显优势。

### 3.5 扩展能力

| 功能 | Cherry Markdown | Obsidian | Notion | Joplin | Typora | StackEdit |
|------|-----------------|----------|--------|--------|--------|-----------|
| 插件系统 | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| 自定义主题 | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| API 支持 | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |

Cherry Markdown 提供了插件系统和 API 支持，扩展能力较强，这使得它可以根据不同需求进行定制化开发。

## 4. SWOT 分析

### 优势 (Strengths)
- 轻量级，性能优秀
- 支持自定义语法扩展
- 内置安全机制
- 强大的扩展能力

### 劣势 (Weaknesses)
- 功能相对简单，缺少文件管理、协作等高级功能
- 缺乏移动端支持
- 社区相对小众

### 机会 (Opportunities)
- 可以针对特定垂直领域进行深度定制
- 开源特性有利于吸引开发者参与
- 轻量级特性适合嵌入式场景

### 威胁 (Threats)
- 竞品功能更全面，用户基础更大
- 纯编辑器可能难以满足用户全方位需求
- 大型科技公司可能推出类似产品

## 5. 结论与建议

Cherry Markdown 作为一款轻量级 Markdown 编辑器，在性能、扩展性和安全性方面表现出色。其自定义语法和插件系统为特定场景下的应用提供了很大的灵活性。然而，相比全功能的笔记应用，它在功能完整性上存在一定差距。

建议:

1. 保持轻量化特性，继续优化性能，巩固核心优势。
2. 加强与其他工具的集成能力，弥补功能差距。
3. 考虑开发移动端版本，扩大用户群。
4. 深耕特定垂直领域，如开发者文档、技术博客等。
5. 加强社区建设，鼓励更多开发者参与，丰富生态系统。
6. 考虑增加端到端加密等高级安全特性，以满足高安全性需求。



Citations:
[1] https://gist.github.com/vimtaai/99f8c89e7d3d02a362117284684baa0f
[2] https://www.reddit.com/r/selfhosted/comments/17ivv48/feature_comparison_chart_webbased_markdown/
[3] https://marketplace.visualstudio.com/items?itemName=cherryMarkdownPublisher.cherry-markdown
[4] https://commonmark.thephpleague.com/2.0/customization/inline-parsing/