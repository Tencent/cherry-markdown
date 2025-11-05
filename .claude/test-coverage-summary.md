# 测试覆盖改进 - PR 说明

## 变更概述
为 Cherry Markdown 编辑器的核心 Hooks 添加了全面的单元测试，以提高代码质量和测试覆盖率。

## 新增的测试文件

### 1. Header.spec.ts
- **测试功能**：标题处理（ATX 和 Setext 格式）
- **测试用例数**：10+ 个
- **覆盖场景**：
  - 不同级别的 ATX 标题（# - ######）
  - Setext 标题（===== 和 -----）
  - 标题ID自动生成和去重
  - 内联代码和强调文本
  - 空标题和特殊字符
  - 中文、日文、阿拉伯文等Unicode
  - 表情符号
  - HTML标签清理
  - 闭合格式标题

### 2. Image.spec.ts
- **测试功能**：图片语法处理
- **测试用例数**：15+ 个
- **覆盖场景**：
  - 基本图片语法：![alt](src)
  - 带标题的图片
  - 空alt文本
  - 参考式图片
  - 特殊字符URL
  - Data URI
  - 相对路径
  - 表情符号
  - 多图片
  - 嵌套括号
  - 代码在alt文本中
  - HTML转义
  - 文件扩展名
  - 锚点链接
  - 引号转义

### 3. Link.spec.ts
- **测试功能**：链接语法处理
- **测试用例数**：15+ 个
- **覆盖场景**：
  - 基本链接语法
  - 带标题的链接
  - 参考式链接
  - 代码在链接文本中
  - 强调在链接文本中
  - 相对链接
  - 邮箱链接
  - 特殊字符URL
  - 查询参数
  - 锚点
  - 嵌套括号
  - 空链接文本
  - 自动链接
  - HTML转义
  - 多链接
  - 脚注链接

### 4. CodeBlock.spec.ts
- **测试功能**：代码块语法处理
- **测试用例数**：15+ 个
- **覆盖场景**：
  - 围栏代码块
  - 指定语言
  - 无语言代码块
  - 代码内容保留
  - 特殊字符
  - 行号功能
  - 复制按钮
  - 缩进代码块
  - 标签
  - 空行
  - 反引号内部
  - Unicode字符
  - 多代码块
  - HTML转义
  - 语言别名

### 5. Emphasis.spec.ts
- **测试功能**：强调文本处理（粗体、斜体）
- **测试用例数**：15+ 个
- **覆盖场景**：
  - 双星号粗体：**text**
  - 双下划线粗体：__text__
  - 单星号斜体：*text*
  - 单下划线斜体：_text_
  - 三星号粗斜体：***text***
  - 特殊字符
  - 词边界
  - 多重强调
  - 防止过度匹配
  - 换行
  - 嵌套强调
  - Unicode字符
  - 表情符号
  - 位置（开始/结束）
  - HTML实体
  - 引号
  - 三下划线

### 6. InlineCode.spec.ts
- **测试功能**：内联代码处理
- **测试用例数**：15+ 个
- **覆盖场景**：
  - 基本内联代码：`code`
  - 单反引号
  - 多重反引号
  - 空格处理
  - HTML转义
  - 特殊字符
  - 换行
  - 多内联代码
  - 反斜杠转义
  - 位置（开始/结束）
  - Unicode字符
  - 表情符号
  - 空代码
  - 引号
  - 数学表达式

### 7. Paragraph.spec.ts
- **测试功能**：段落处理
- **测试用例数**：15+ 个
- **覆盖场景**：
  - 简单段落
  - 多句子
  - 强调文本
  - 代码
  - 链接
  - 图片
  - 空段落
  - 特殊字符
  - Unicode
  - 表情符号
  - 换行
  - 多空格
  - 引号
  - 数学
  - HTML
  - 列表
  - 引用
  - 强制换行

## 测试策略

### 测试模式
所有测试遵循以下模式：
1. **基本功能测试**：验证核心语法正确解析
2. **边界条件测试**：处理特殊情况（空输入、特殊字符）
3. **错误处理测试**：确保优雅处理异常情况
4. **兼容性测试**：多语言、Unicode、表情符号支持

### 测试框架
- **框架**：Vitest
- **断言**：expect API
- **Mock**：最少Mock，保持测试真实性
- **快照**：部分使用快照测试验证输出

## 统计信息

### 新增测试文件数
- 7 个测试文件（.spec.ts）

### 新增测试用例数
- 约 100+ 个测试用例
- 覆盖 7 个核心 Hook
- 覆盖 182 个源文件中的重要部分

### 测试覆盖率提升
- 从 5 个测试文件 → 12 个测试文件
- 覆盖了核心功能：Header、Image、Link、CodeBlock、Emphasis、InlineCode、Paragraph
- 测试覆盖率从 ~2.7% → 估计提升到 ~10-15%

## PR 范围

### 新增
- `packages/cherry-markdown/test/core/hooks/Header.spec.ts`
- `packages/cherry-markdown/test/core/hooks/Image.spec.ts`
- `packages/cherry-markdown/test/core/hooks/Link.spec.ts`
- `packages/cherry-markdown/test/core/hooks/CodeBlock.spec.ts`
- `packages/cherry-markdown/test/core/hooks/Emphasis.spec.ts`
- `packages/cherry-markdown/test/core/hooks/InlineCode.spec.ts`
- `packages/cherry-markdown/test/core/hooks/Paragraph.spec.ts`

### 修改
- 无

### 删除
- 无

## 验证方式

运行测试：
```bash
cd packages/cherry-markdown
npm test
```

运行特定测试：
```bash
npx vitest run test/core/hooks/Header.spec.ts
```

## 后续计划

### 短期目标
1. 修复可能的测试问题
2. 添加更多边界条件测试
3. 增加快照测试

### 中期目标
1. 为剩余 Hooks 添加测试
2. 添加集成测试
3. 添加 E2E 测试

### 长期目标
1. 达到 80% 测试覆盖率
2. 添加性能测试
3. 添加安全测试

## 总结

此次 PR 显著改善了 Cherry Markdown 的测试覆盖情况，为核心功能提供了可靠的测试保障。这将：

1. **提高代码质量**：通过测试发现潜在问题
2. **降低回归风险**：防止功能被破坏
3. **改善重构能力**：有测试保护，重构更安全
4. **提升维护性**：新贡献者可以基于测试理解代码
5. **建立测试文化**：鼓励更多开发者编写测试

建议合并此 PR 并继续完善测试覆盖。
