/** One source consumed unchanged by the real Web renderer and native components. */
export const MOBILE_PARITY_MARKDOWN = `# 移动端样式对照

这是同一份 Markdown，正文包含 **加粗**、*斜体*、~~删除线~~、\`inline code\` 与 [Cherry 链接](/docs)。English words wrap at the same content width.

第二段用于核对段落间距。中文 English 12345，标点与字体保持默认设置。

## 二级标题 Heading

### 三级标题 Heading

#### 四级标题 Heading

##### 五级标题 Heading

###### 六级标题 Heading

> 引用内容包含 **加粗** 和第二行文字，检查内边距、边框及自然换行。
>
> 第二个引用段落。

- 第一项列表
- 第二项列表，较长内容在移动端应当自然换行并保持缩进。
  - 嵌套列表
    - 第三级

1. 第一项有序列表
2. 第二项有序列表

- [x] 已完成任务
- [ ] 待处理任务

---

!!#c0392b Cherry 颜色!! 和 !24 原生字号!。

\`\`\`js
const message = 'hello mobile';
console.log(message);
\`\`\`

| 能力 | 说明 | 状态 |
| --- | --- | --- |
| 链接 | [Cherry](/docs) | 已支持 |
| 多行 | 单元格较长文字在移动端换行 | 原生 |

:::tip 信息面板
这是面板正文，包含 **强调**。
:::

+++ 展开详情
这是展开后的正文，包含 **强调**。
+++
`;
