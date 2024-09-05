# Cherry Markdown 中阶任务

# 题目二：**竞品分析**

分析对比竞品，从语法能力、功能、安全、性能、扩展能力等维度进行对比。其中客观数据（如性能）需要给出运行环境描述。

## 题目分析：

1. 有什么竞品
2. 之间的语法能力、功能、安全、性能、扩展能力怎么样？
3. 其他可以比较的点

### 问题一：有什么竞品

经过筛选，有以下竞品：

1. [**markdown-here**](https://github.com/adam-p/markdown-here)
2. [**marktext**](https://github.com/marktext/marktext)
3. [**marked**](https://github.com/markedjs/marked)

为什么选这三款竞品？

查看了一下市面上关于markdown的产品多如牛毛，有很多成型的笔记应用，如notion，印象笔记，Typora等等，但这些产品难以查看起源码，所以难以分析，不在分析范围内。本次竞品分析的筛选目标是Github上开源且star数极多的项目，证明得到了大多数人的认可，本人猜测可能创新了使用方式亦或是在原有基础上进行了改进。经过我一通筛查，最终选出这三个竞品进行分析，这三个项目的Star数都很大

**三款Star数**

1. [**markdown-here](https://github.com/adam-p/markdown-here) → 59.6k**
2. [**marktext](https://github.com/marktext/marktext) → 46.3k**
3. [**marked](https://github.com/markedjs/marked) → 32.7k**
4. [**cherry-markdown](https://github.com/Tencent/cherry-markdown) → 3.5k**

所以挑选出这几款进行分析。

### 问题二：之间的语法能力、功能、安全、性能、扩展能力怎么样？

在分析这些内容之前，先简单的全面介绍一下这三个产品

| [**markdown-here](https://github.com/adam-p/markdown-here)**  | Markdown Here 是一个开源工具，它允许您在各种地方快速轻松地创建和编辑 Markdown 文档。借助这款工具，您可以使用熟悉的 Markdown 语法撰写电子邮件、论坛帖子或任何支持富文本格式的内容，然后一键将其转换为 HTML 或其他格式。
Markdown Here 的应用

1. 电子邮件 - 在 Gmail、Yahoo Mail、Outlook 等邮件客户端中轻松撰写格式化的 Markdown 邮件。
2. 论坛 - 在 Reddit、Stack Overflow 或其他讨论板上发布格式清晰、易于阅读的 Markdown 帖子。
3. 博客 - 在 WordPress、Medium 或自定义 CMS 平台上撰写和预览 Markdown 博客文章。
4. 在线文档 - 使用 Markdown 编辑在线文档，如 Google Docs、Quip 等。 |
| --- | --- |
| [**marktext](https://github.com/marktext/marktext)**  | 是一个轻量级且直观的Markdown编辑器，专为提高写作效率和享受流畅的 Markdown 编辑体验而设计。它的目标是提供一个无干扰的界面，让内容创作者专注于文字本身，而不是复杂的排版和设置。

MarkText 基于 Electron 框架构建，这意味着它是一个跨平台的应用程序，可以在Windows, macOS 和 Linux上运行。Electron 使用 HTML, CSS 和 JavaScript 开发桌面应用，使得开发者能够利用 web 开发的技术栈轻松实现功能。
编辑器的核心特性之一是实时预览，这是通过解析 Markdown 语法并利用浏览器的渲染能力实现的。这种实时同步的方式使用户在编写时能够即时看到效果，无需频繁切换视图。
此外，MarkText 支持 Markdown 扩展如 MathJax（用于数学公式）、Mermaid（流程图和序列图）等，这些都依赖于现代 Web 的库和框架。它还集成了文件系统操作，可以方便地保存、打开和管理本地文件。 |
| [**marked**](https://github.com/markedjs/marked) | 是一个高性能 Markdown 解析库，用于将 Markdown 格式的文本转换为 HTML。这款库在 JavaScript 社区中广受好评，不仅因为其出色的效率，还因为它遵循了 Markdown 的原生语法并提供了可定制化的选项

Marked 使用了一种名为"预编译"的方法来提升解析速度，这种方法将解析规则提前处理，使得在实际解析过程中可以快速完成。它基于 CommonJS 规范编写，同时也支持浏览器环境和现代构建工具（如 Webpack 或 Rollup）。
Marked 支持多种常用的 Markdown 扩展，例如表格、代码高亮、脚注等，并且可以根据需要自定义渲染规则。它使用了一种插件系统，允许你通过中间件的方式扩展功能。 |
| [**cherry-markdown**](https://github.com/Tencent/cherry-markdown) | Cherry-Markdown是由腾讯推出的一款开源、轻量级且高度自定义的在线Markdown编辑器项目。该项目旨在提供一个高效、易用且功能丰富的平台，帮助开发者和写作爱好者提升编写Markdown文档的体验。 |

大家可以简单对于这三个竞品有一个大致的了解，便于接下来我们分析竞品

---

### 功能

先说说最直观的功能

**通用功能**就不赘述了，包括但不限于

- **Markdown语法支持**：
    - 这四个项目都支持Markdown的基本语法，如标题、段落、列表（无序列表和有序列表）、链接、图片、代码块等
- **代码高亮**
    - MarkText、marked（通过扩展或配置）、Cherry-Markdown都支持代码块的语法高亮，使得包含代码的Markdown文档更加易读。Markdown-Here在邮件客户端中也支持代码高亮，但可能需要特定的扩展或配置。
- **跨平台支持**：
    - 虽然Markdown-Here作为浏览器扩展，其跨平台性主要体现在浏览器上，但MarkText、marked（作为JavaScript库）、Cherry-Markdown都支持在多种操作系统上运行或使用，体现了Markdown工具的跨平台特性。
- **可定制性（通过不同方式）**：
    - 这四个项目都在不同程度上提供了可定制性。例如，MarkText和Cherry-Markdown支持主题定制和插件系统；marked通过配置选项和API扩展实现可定制性；Markdown-Here虽然主要通过浏览器扩展提供功能，但用户也可以通过自定义CSS等方式进行一定程度的定制。

**各自功能**

|  项目名称 | **浏览器扩展** | **多主题选择** | **实时预览** | **快捷键支持** | **图片粘贴** | **导出功能** |
| --- | --- | --- | --- | --- | --- | --- |
| Markdown-Here | √ | √ | √ | √ | × | × |
| MarkText | √ | √ | √ | √ | √ | √ |
| marked | √ | √ | √ | √ | × | × |
| Cherry-Markdown | √ | √ | √ | √ | √ | × |

**专属功能**

| 项目名称 | 专属 |
| --- | --- |
| Markdown-Here | 1. **邮件客户端集成**：Markdown Here的主要特点是它允许用户在各种邮件客户端（如Gmail、Outlook等）中直接编写Markdown格式的邮件，并在发送前将Markdown渲染为美观的HTML格式。这一功能极大地方便了需要在邮件中插入复杂格式或代码的用户。
2. 代码块和TeX公式渲染：Markdown Here支持代码块的语法高亮和TeX公式的渲染，使得包含代码或数学公式的邮件编写变得更加容易和美观。 |
| MarkText | 1. 丰富的自定义主题及**插件系统**：MarkText拥有丰富的自定义主题和插件系统，用户可以根据自己的喜好和需求调整编辑器的外观和功能，提升写作体验。 |
| marked | 1. 高性能Markdown解析器：高性能的Markdown解析库，专注于将Markdown格式的文本快速转换为HTML。它采用了**“预编译”方法**来提升解析速度，使得在处理大量Markdown文本时表现出色。
2. 高度可定制：Marked提供了丰富的可定制化选项，用户可以通过中间件扩展功能，根据需求自定义渲染规则，满足多样化的应用场景。 |
| Cherry-Markdown | 1. 高度自定义与插件系统：Cherry Markdown同样提供了高度自定义的功能，用户可以通过插件系统添加新的快捷键、修改主题或扩展其他功能。这种灵活性使得Cherry Markdown能够适应不同用户的个性化需求。
2. **增强型Markdown特性**：除了标准的Markdown语法外，Cherry Markdown还支持一些增强型特性，如表格、任务列表、流程图、Mermaid图表等，这些特性增强了Markdown文档的表现力和实用性。 |

---

### 扩展能力

这四个项目都具有扩展能力，下面逐个进行扩展能力的分析

**通用扩展能力**

1. 自定义CSS样式
    1. 允许用户通过自定义CSS样式来修改渲染后的HTML内容的外观。这包括字体、颜色、边距、背景等多个方面。用户可以在**markdown-here**的设置界面中，将自定义的CSS样式复制到“基本渲染CSS”或相应的配置项中。通过这种方式，用户可以根据自己的喜好和需求，调整渲染后的邮件或文档的外观，使其更加符合个人或团队的视觉风格。

**扩展能力**

| 项目名称 | 使用扩展或插件 | API |
| --- | --- | --- |
| Markdown-Here | × | × |
| MarkText | √ | × |
| marked | √  | × |
| Cherry-Markdown | × | √ |

---

### 语法能力

目前各类markdown的语法规范基本都是参考：

- [commonmark 0.31.2](https://spec.commonmark.org/0.31.2/)
- [GFM 0.29-gfm](https://github.github.com/gfm)

下面纵向对比一下

| **项目** | **语法能力** | 特点 |
| --- | --- | --- |
| Markdown-Here | 支持基本Markdown语法，允许通过CSS配置外观 | 浏览器插件，快速将Markdown转换为HTML |
| Mark Text | 支持丰富的Markdown语法，包括GFM和公式渲染 | 这些特性包括但不限于GFM支持、表格、代码块、数学公式渲染（通过LaTeX语法）、主题和CSS样式自定义等 |
| Marked | 支持广泛的Markdown语法，包括原始Markdown、CommonMark和GFM | 高性能Markdown解析器和编译器，专为速度优化而设计 |
| Cherry-Markdown | 支持标准Markdown语法CommonMark和自定义语法 | 高度可定制，允许用户定义自己的语法规则 |

基本都是依托于Commonmark和GFM的，MarkText增加了数学公式渲染，更加方便

---

### 安全性

针对于markdown有一些通用的安全问题，问题如下

1. 跨站脚本攻击（XSS）：
    - 问题描述：当Markdown内容被转换为HTML并在Web应用中显示时，如果未正确处理HTML标签和JavaScript代码，可能会导致XSS攻击。攻击者可以通过注入恶意脚本，在用户浏览器中执行未授权的代码。
    - 防护措施：使用可靠的Markdown解析器，并在转换过程中对HTML标签和JavaScript进行适当的清理或转义。
2. 不安全的外部资源链接：
    - 问题描述：Markdown文档可能包含外部图像、脚本或其他资源的链接。如果这些资源链接到恶意网站或包含恶意内容，可能会对用户造成危害。
    - 防护措施：仅从可信赖的源加载外部资源，使用内容安全策略（CSP）来限制资源加载的来源。
3. 代码注入：
    - 问题描述：在Markdown编辑器中，如果用户输入的内容被直接嵌入到后端代码或数据库查询中，而未经适当处理，可能会导致代码注入攻击。
    - 防护措施：对用户输入进行严格的验证和清理，避免将未经验证的数据直接用于代码执行或数据库查询

| **项目名称** | **问题** | **防护措施** |
| --- | --- | --- |
| Markdown-Here | 插件权限滥用
与其他插件的冲突 | 1. 确保插件来源可靠
2. 避免安装未知或未经验证的插件
3. 定期检查插件的更新和安全补丁 |
| Mark Text | DOM型XSS漏洞
不安全的HTML粘贴 | 1. 使用最新版本的Mark Text
2. 避免将不受信任的HTML代码粘贴到编辑器中
3. 对HTML内容进行适当的过滤和清理 |
| Marked | 进行了RDos安全测试 | 1. 在使用Marked时，结合使用如DOMPurify、sanitize-html等库来清理和转义HTML输出
2. 验证和清理所有外部输入 |
| Cherry-Markdown | 自定义语法的安全风险
内置的安全Hook可能不足 | 1. 谨慎使用自定义语法，并确保这些语法得到妥善的处理和验证
2. 定期检查Cherry-Markdown的安全更新和修复
3. 使用额外的安全措施，如内容安全策略（CSP） |

---

### 性能

性能测试目前正在调研和测试学习阶段，预计9月中旬完成~敬请期待

### 问题三

1. 其他可以比较的点

发散思维：技术栈，用户体验，社区建设…

### 用户体验：

针对于用户可能会使用点我进行了总结和体验，从多角度进行了分析，得出以下表格

| **项目名称** | **使用场景** | **界面简洁性** | **即时预览** | **学习曲线** | **交互性** |
| --- | --- | --- | --- | --- | --- |
| Markdown-Here | 浏览器插件，电子邮件、论坛等富文本编辑器 | 高（通过简单的右键菜单或快捷键操作） | 否（需要手动转换） | 低（对于熟悉Markdown语法的用户） | 流畅（无需离开当前环境） |
| Mark Text | 独立的桌面Markdown编辑器 | 高（提供多种主题和编辑模式） | 是（支持Markdown的即时预览） | 低（Markdown语法学习成本低） | 优秀（界面友好，操作直观） |
| Marked | 作为库或框架的一部分，用于Web应用 | 不直接相关（依赖于集成它的应用） | 不直接相关（依赖于集成方式） | 不直接相关（由开发者决定） | 不直接相关（由集成它的应用决定） |
| Cherry-Markdown | 可能的Web编辑器或集成到Web应用 | 取决于实现和集成方式 | 可能支持（取决于具体实现） | 低至中（取决于自定义语法和功能的复杂性） | 取决于集成方式，但通常追求用户友好 |

---

### 技术栈：

| **项目名称** | **技术栈** | **备注** |
| --- | --- | --- |
| Markdown-Here | 浏览器扩展（Chrome, Firefox, Opera） JavaScript（主要） CSS | Markdown-Here是一个浏览器扩展，主要用于将Markdown转换为富文本格式，支持多种浏览器平台。它依赖于JavaScript和CSS来实现其功能。 |
| Mark Text | Electron 框架 Vue.js（前端框架）HTML, CSS, JavaScript | Mark Text是一个跨平台的Markdown编辑器，基于Electron框架构建，利用Vue.js进行前端开发，支持Windows、macOS和Linux。 |
| Marked | JavaScript（Node.js）浏览器端也支持 | Marked是一个用于解析Markdown的JavaScript库，可以在Node.js环境中使用，也可以在浏览器端通过引入其脚本文件来使用。它专注于Markdown的解析，并不直接提供编辑界面。 |
| Cherry-Markdown | - Vue.js（基于Vue 3）HTML5, CSS3, JavaScript 插件系统（支持扩展） | Cherry Markdown是由腾讯推出的一款开源、轻量级且高度自定义的在线Markdown编辑器，使用Vue.js（基于Vue 3）框架构建，支持现代Web技术如HTML5、CSS3和JavaScript。通过插件系统，用户可以根据需求进行定制。 |