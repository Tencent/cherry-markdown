/** Shared initial document for Web/native interaction and streaming acceptance. */
export const MOBILE_INTERACTION_MARKDOWN = `# 原生交互与流式更新

+++ 点击展开并保留状态
展开后，在表格追加内容时应保持打开。
+++

\`\`\`js
const longLine = '横向滚动代码：abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
console.log(longLine);
\`\`\`

| 一 | 二 | 三 | 四 | 五 |
| --- | --- | --- | --- | --- |
| 初始 | 内容 | 横向 | 滚动 | 末列 |
`;

export const MOBILE_INTERACTION_APPEND = '| 追加 | 新的一行说明 | 保留 | 偏移 | 完成 |\n';
