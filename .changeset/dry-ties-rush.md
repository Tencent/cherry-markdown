---
'cherry-markdown': minor
---

refactor: #1229 丰富图表的类型并增加图表交互

- style: 格式优化
  - style: 格式化 cherry-table-echarts-plugin.js
  - style: 修正 cherry-table-echarts-plugin.js 的 license 的描述
- refactor: 图表按钮配置的修改
  - refactor: 删除所有图表的“数据视图”按钮
  - refactor: 删除折线图/柱形图转换为折线图/柱形图的按钮
  - refactor: 删除折线图的选区相关的按钮
- refactor: 各图表配置生成的整体重构
  - refactor: 重构、封装各个图表的代码（独立模式->继承模式）
  - refactor: 重构、简化各个图表的代码（继承模式->组合模式）
  - refactor: 统一、简化图表参数的调用（基于组合模式）
- refactor: 修改用户自定义配置（编辑器文本）的代码
  - refactor: 重构图表参数解析的代码
  - feat: 支持图表自定义标题
  - refactor: 删除上一个版本配置地图数据源的代码
  - refactor: 替换所有图表的自定义参数为新模式
- refactor: 地图数据源的优化
  - refactor: 重构、封装、简化地图数据源加载的代码
  - feat: 支持各个地图使用不同的数据源的配置（而非全局一致）
  - fix:  修复请求外部地图数据源 403 的 bug
- refactor: 修改工具栏菜单中的图表相关内容
  - refactor: 将图表符号改为文本
  - feat: 增加各个图表的图标
  - refactor: 增加/修改各个图表的多语言文本
  - feat: 新增全局的图表菜单的配置
  - refactor: 替换 index-demo.js 对于图表菜单的调用
  - fix: 修复图表菜单无法插入代码的 bug
- refactor: 调整basic.md
  - feat: 增加热力图和饼图的示例和效果
  - refactor: 删除旧版的图表参数
  - feat: 每个图表增加标题的配置参数
  - docs: 修改自定义地图数据源的示例代码
