研究CommonMark规范，完善Cherry Markdown行内语法hook(sentence hook)以支持更多CommonMark语法特性，并增加通过10个单测用例。

## 题目细分：

1. 研究**CommonMark规范**
2. 完善**CherryMarkdown行内语法hook**→支持更多CommonMark语法特性
3. 增加10个单测用例

### 具体分析1:研究**CommonMark规范**

根据readme里面的内容，可以看到CommonMark规范及测试用例https://spec.commonmark.org/

网站内最新的test cases是24年1月28号的，版本为0.31.2，具体研究这一份规范

同时网站内还有其他功能，discussion forum（已失效）、dingus互动（在线互动）、changelog等等

CommonMark 是 Markdown 语法的合理化版本，具有[规范](https://spec.commonmark.org/)和用 C 和 JavaScript 编写的 BSD 许可参考实现。

https://spec.commonmark.org/0.31.2/ 包含了markdown语法的实现规则

这里有点混淆了 markdown，commonmark，cherrymarkdown三者之间的关系和联系。理清楚了一下。

### **一、Markdown**

Markdown是一种轻量级标记语言，由约翰·格鲁伯（John Gruber）在2004年创造，并与亚伦·斯沃茨（Aaron Swartz）共同合作完善其语法。Markdown的核心理念是使用易于阅读、易于撰写的纯文本格式，并可选择性地转换成有效的XHTML或HTML。它吸收了电子邮件中纯文本标记的特性，并设计成直观易用的文本格式。Markdown广泛用于各种网站和平台，如GitHub、Reddit、WordPress等，成为撰写帮助文档、论坛消息、电子书等的流行选择。

### **二、CommonMark**

CommonMark是对Markdown语法的标准化尝试，旨在解决Markdown不同实现之间的不一致性问题。它定义了一套明确的语法规则，包括块级元素（如段落、标题、列表）和内联元素（如链接、强调、代码）等，以确保Markdown文档在不同平台和编辑器上的一致性和可预测性。CommonMark是一个规范，不是一个具体的实现，但它为Markdown的标准化提供了基础。

### **三、CherryMark**

CherryMark是由腾讯推出的一款开源、轻量级且高度自定义的在线Markdown编辑器。Cherry Markdown使用现代Web技术构建，如HTML5、CSS3和JavaScript（基于Vue.js框架），提供了实时预览、代码块语法高亮、插件系统等丰富功能，旨在提升开发者和写作爱好者编写Markdown文档的体验。Cherry Markdown是Markdown的一个具体应用或工具，遵循Markdown（及CommonMark）语法规范。

### **四、关系和区别**

- **Markdown** 是基础，定义了轻量级标记语言的核心概念和语法。
- **CommonMark** 是对Markdown语法的标准化，旨在解决不同实现间的兼容性问题。
- **CherryMark** 是Markdown的一个具体应用工具，提供了丰富的编辑功能和用户体验优化，可能遵循Markdown或CommonMark规范。
