import Cherry from 'cherry-markdown';
import 'cherry-markdown/dist/cherry-markdown.css';
import { attachCherryMilkdownPreview } from '@cherry-markdown/milkdown';
import '@cherry-markdown/milkdown/styles.css';
import '@milkdown/kit/prose/view/style/prosemirror.css';

async function main() {
  const value = [
    '---',
    'title: Cherry Markdown',
    'owner: Cherry Oteam',
    '---',
    '',
    '# Cherry Markdown',
    '',
    '[[toc]]',
    '',
    '这个页面仍然是 Cherry Markdown 的预览页。现在可以直接点击标题、正文、列表和表格进行编辑。',
    '',
    '文字样式：!!#d54941 红色!!、!!!#fff1b8 背景色!!!、==高亮==、^^下标^^ 和 ^上标^。',
    '',
    '点击行内公式 $E=mc^2$，可以直接在公式中输入和修改。',
    '',
    '$$',
    '\\int_0^1 x^2 \\, dx',
    '$$',
    '',
    '| Feature | Status |',
    '| --- | --- |',
    '| Cherry 原预览样式 | 保持不变 |',
    '| Milkdown 原位编辑 | 已接入 |',
    '',
    '::: warning 当前预览区可编辑',
    'Milkdown 只接管文档内容，Cherry 继续管理页面、主题、工具栏和 Markdown 数据。',
    ':::',
    '',
    '+++- 更多能力',
    'Detail 正文同样在当前预览位置编辑。',
    '+++',
    '',
    '```mermaid',
    'flowchart LR',
    '  CherryPreview --> Milkdown --> Markdown',
    '```',
  ].join('\n');

  const cherry = new Cherry({
    id: 'editor',
    value,
    editor: {
      defaultModel: 'previewOnly',
      height: '100%',
    },
    previewer: {
      enablePreviewerBubble: true,
    },
  });
  const editor = await attachCherryMilkdownPreview(cherry);
  window.cherry = cherry;
  window.cherryMilkdown = editor;
  window.detachCherryMilkdown = () => editor.detach();
}

void main();
