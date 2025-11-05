# Cherry Markdown 测试覆盖改进计划

## 目标
为核心Hooks添加单元测试，提高测试覆盖率

## 当前测试状态
- 已存在测试：5个文件
  - `test/core/CommonMark.spec.ts` - CommonMark规范测试
  - `test/core/hooks/AutoLink.spec.ts` - 自动链接测试
  - `test/core/hooks/List.spec.ts` - 列表测试
  - `test/utils/regexp.spec.ts` - 正则工具测试

## 需要测试的核心Hooks（按优先级排序）

### 高优先级（核心功能）
1. **Header.js** - 标题处理
2. **Image.js** - 图片处理
3. **Link.js** - 链接处理
4. **CodeBlock.js** - 代码块处理
5. **Table.js** - 表格处理

### 中优先级（常用功能）
6. **Emphasis.js** - 强调（粗体、斜体）
7. **Footnote.js** - 脚注
8. **Emoji.js** - 表情符号
9. **InlineCode.js** - 内联代码
10. **Paragraph.js** - 段落处理

### 低优先级（辅助功能）
11. **AutoLink.js** - 自动链接（已有测试）
12. **Color.js** - 颜色
13. **Size.js** - 字号
14. **Strikethrough.js** - 删除线
15. **Br.js** - 换行

## 测试结构
每个测试文件应包含：
1. 基本功能测试
2. 边界条件测试
3. 错误处理测试
4. 特殊字符测试

## 进度跟踪
- [ ] Header.spec.ts
- [ ] Image.spec.ts
- [ ] Link.spec.ts
- [ ] CodeBlock.spec.ts
- [ ] Table.spec.ts
- [ ] Emphasis.spec.ts
- [ ] Footnote.spec.ts
- [ ] Emoji.spec.ts
- [ ] InlineCode.spec.ts
- [ ] Paragraph.spec.ts
