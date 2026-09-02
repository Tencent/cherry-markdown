import Cherry from 'cherry-markdown';
import 'cherry-markdown/dist/cherry-markdown.css';
import { milkdown } from '@cherry-markdown/milkdown';
import '@cherry-markdown/milkdown/styles.css';
import '@milkdown/kit/prose/view/style/prosemirror.css';
import './visual.css';
import { loadDemoDependencies } from './react/demo-support';

window.Cherry = Cherry;
window.milkdown = milkdown;

await loadDemoDependencies();
// The shared legacy demo config reads the global Cherry constructor while it
// is evaluated, so load it only after the globals above are installed.
// @ts-expect-error This JavaScript demo config has no declaration file.
const { basicConfig } = await import('../../../examples/assets/scripts/index-demo.js');

const value = [
  '# Visual contract',
  '',
  'Paragraph with **bold**, *italic*, `inline code`, ==highlight== and !!#d54941 color!!.',
  '',
  '- [ ] todo',
  '- [x] done',
  '',
  '> Native Cherry blockquote',
  '',
  '| Name | Value |',
  '| --- | ---: |',
  '| Cherry | 1 |',
  '| Milkdown | 2 |',
  '',
  '| :line:{"title":"Trend"} | Jan | Feb |',
  '| --- | ---: | ---: |',
  '| Sales | 1 | 2 |',
  '',
  ':::warning Notice',
  'Panel body.',
  ':::',
  '',
  '## Footnote[^note]',
  '',
  '[^note]: Native footnote reference.',
  '',
  '+++ More abilities',
  'Detail body.',
  '+++',
  '',
  '```js',
  'const visual = true;',
  '```',
].join('\n');

const basicVisualConfig = { ...basicConfig };
delete basicVisualConfig.id;
// The comparison fixture contains no formulas. Disable the legacy demo's
// remote MathJax bootstrap so a CDN-side singleton error cannot contaminate a
// pure Cherry-vs-Milkdown visual assertion.
basicVisualConfig.externals = { ...basicConfig.externals, MathJax: undefined };
basicVisualConfig.engine = {
  ...basicConfig.engine,
  syntax: {
    ...basicConfig.engine.syntax,
    mathBlock: { ...basicConfig.engine.syntax.mathBlock, engine: 'katex', src: '' },
    inlineMath: { ...basicConfig.engine.syntax.inlineMath, engine: 'katex' },
  },
};
const common = {
  ...basicVisualConfig,
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
