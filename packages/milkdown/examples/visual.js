import Cherry from 'cherry-markdown';
import 'cherry-markdown/dist/cherry-markdown.css';
import { milkdown } from '@cherry-markdown/milkdown';
import '@cherry-markdown/milkdown/styles.css';
import '@milkdown/kit/prose/view/style/prosemirror.css';

window.Cherry = Cherry;
window.milkdown = milkdown;

const value = [
  '# Visual contract',
  '',
  'Paragraph with **bold**, *italic*, `inline code`, ==highlight== and !!#d54941 color!!.',
  '',
  '> Native Cherry blockquote',
  '',
  '| Name | Value |',
  '| --- | ---: |',
  '| Cherry | 1 |',
  '| Milkdown | 2 |',
  '',
  ':::warning Notice',
  'Panel body.',
  ':::',
  '',
  '+++ More abilities',
  'Detail body.',
  '+++',
  '',
  '```js',
  'const visual = true;',
  '```',
].join('\n');

const common = {
  value,
  editor: { defaultModel: 'previewOnly', height: '920px' },
  toolbars: { toolbar: false, toolbarRight: false, sidebar: false },
};

window.nativeCherry = new Cherry({ ...common, el: document.querySelector('#native') });
window.milkdownCherry = new Cherry({
  ...common,
  el: document.querySelector('#milkdown'),
  extensions: [milkdown({ debounce: 0 })],
});

window.visualReady = new Promise((resolve) => {
  const check = () => {
    if (document.querySelector('#milkdown .ProseMirror')) resolve();
    else requestAnimationFrame(check);
  };
  check();
});
