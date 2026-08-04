import { createCherryMilkdown } from '@cherry-markdown/milkdown';
import '@cherry-markdown/milkdown/styles.css';
import '@milkdown/kit/prose/view/style/prosemirror.css';
import 'katex/dist/katex.min.css';

async function main() {
  const editor = await createCherryMilkdown({
    root: document.querySelector('#editor'),
    value: [
      '# Cherry Milkdown WYSIWYG',
      '',
      '[[toc]]',
      '',
      '直接编辑 **粗体**、表格、公式和 Cherry 扩展样式，不需要右侧预览。',
      '',
      '文字样式：!!#d54941 红色!!、!!!#fff1b8 背景色!!!、==高亮==、^^下标^^ 和 ^上标^。',
      '',
      '行内公式 $E=mc^2$ 会直接渲染。',
      '',
      '| Feature | Status |',
      '| --- | --- |',
      '| CommonMark / GFM | WYSIWYG |',
      '| Cherry extensions | Visual nodes and marks |',
      '',
      '::: warning',
      'Cherry panel 默认显示渲染结果，选中后可编辑其配置。',
      ':::',
      '',
      '```mermaid',
      'flowchart LR',
      '  Markdown --> Milkdown --> WYSIWYG',
      '```',
    ].join('\n'),
  });
  window.cherryMilkdown = editor;
}

void main();
