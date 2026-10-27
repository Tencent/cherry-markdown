import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const root = resolve(process.argv[2] || resolve(dirname(fileURLToPath(import.meta.url)), '../..'));
const components = resolve(root, 'dist/components');
const definitions = new Map();
const clipboard = [];
const previews = [];
for (const name of ['markdown', 'block', 'inlines']) {
  const directory = resolve(components, name);
  const config = JSON.parse(readFileSync(resolve(directory, 'index.json'), 'utf8'));
  const template = readFileSync(resolve(directory, 'index.wxml'), 'utf8');
  assert.doesNotMatch(template, /<(?:web-view|rich-text)\b/);
  for (const dependency of Object.values(config.usingComponents || {})) {
    for (const extension of ['js', 'json', 'wxml', 'wxss']) {
      assert.ok(existsSync(`${resolve(directory, dependency)}.${extension}`));
    }
  }
  runInNewContext(readFileSync(resolve(directory, 'index.js'), 'utf8'), {
    exports: {},
    Component: (definition) => definitions.set(name, definition),
    wx: { setClipboardData: (value) => clipboard.push(value), previewImage: (value) => previews.push(value) },
    console,
    setTimeout,
    clearTimeout,
  });
  assert.ok(definitions.has(name), `${name} registers without DOM, window, require or browser globals`);
}

const definition = definitions.get('markdown');
const page = {
  data: { markdown: '', streaming: false, updateInterval: 80, blocks: [] },
  setData(patch, done) {
    for (const [key, value] of Object.entries(patch)) {
      const match = /^blocks\[(\d+)\]$/.exec(key);
      if (match) this.data.blocks[Number(match[1])] = value;
      else this.data[key] = value;
    }
    done?.();
  },
};
definition.lifetimes.attached.call(page);
const markdown = '# Native\n\n- outer\n  - inner\n\n```js\nconst answer = 42;\n```\n\n![A](/a.png)\n\n---';
definition.methods.setMarkdown.call(page, markdown, false);
assert.ok(page.data.blocks.some((block) => block.type === 'code_block'));
assert.ok(page.data.blocks.some((block) => block.type === 'image'));
assert.ok(page.data.blocks.some((block) => block.type === 'thematic_break'));
assert.ok(!JSON.stringify(page.data.blocks).includes('"type":"html"'));
definition.lifetimes.detached.call(page);
assert.equal(page.controller, undefined);

const event = (dataset) => ({ currentTarget: { dataset } });
definitions.get('block').methods.copyCode(event({ text: 'const answer = 42;' }));
definitions.get('inlines').methods.previewImage(event({ src: '/a.png' }));
assert.equal(clipboard[0].data, 'const answer = 42;');
assert.equal(previews[0].current, '/a.png');
const emitted = [];
definitions
  .get('inlines')
  .methods.linkTap.call({ triggerEvent: (...args) => emitted.push(args) }, event({ href: '/pages/detail/index' }));
assert.equal(emitted[0][0], 'linktap');
assert.equal(emitted[0][1].href, '/pages/detail/index');
assert.equal(emitted[0][2].composed, true);

// The public declarations must work for a strict TS consumer, independently of source aliases.
const temporary = mkdtempSync(resolve(tmpdir(), 'cherry-native-types-'));
try {
  const consumer = resolve(temporary, 'consumer.ts');
  mkdirSync(resolve(temporary, 'node_modules/@cherry-markdown'), { recursive: true });
  symlinkSync(root, resolve(temporary, 'node_modules/@cherry-markdown/miniprogram'), 'dir');
  writeFileSync(
    consumer,
    `import CherryStream, { NativeMarkdownController } from '@cherry-markdown/miniprogram';
import type { MiniProgramViewBlock } from '@cherry-markdown/miniprogram';
const blocks: MiniProgramViewBlock[] = new CherryStream().setMarkdown('hello');
const controller = new NativeMarkdownController((patch, done) => { Object.keys(patch); done(); });
controller.setMarkdown('hello', true); controller.dispose();
new CherryStream().getParseStats().mode;
blocks.forEach(block => { if (block.type === 'list') block.children.forEach(item => item.children); });
`,
  );
  const program = ts.createProgram([consumer], {
    strict: true,
    noEmit: true,
    skipLibCheck: false,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    types: [],
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(
    diagnostics.length,
    0,
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCurrentDirectory: () => temporary,
      getCanonicalFileName: (file) => file,
      getNewLine: () => '\n',
    }),
  );
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

const { default: CherryStream, NativeMarkdownController } = await import(
  pathToFileURL(resolve(root, 'dist/miniProgram.esm.js')).href
);
assert.equal(new CherryStream().setMarkdown('**hello**')[0].type, 'paragraph');
assert.equal(typeof NativeMarkdownController, 'function');
const semantic = new CherryStream();
semantic.engine.makeHtml = () => {
  throw new Error('HTML intermediate');
};
const prefix = Array.from({ length: 100 }, (_, index) => `Paragraph ${index}`).join('\n\n');
semantic.setMarkdown(`${prefix}\n\nTail`);
const nativeView = semantic.setMarkdown(`${prefix}\n\nTail updated`);
assert.equal(semantic.getParseStats().mode, 'incremental');
assert.ok(semantic.getParseStats().parsedCharacters < 100);
assert.deepEqual(nativeView, new CherryStream({ incremental: false }).setMarkdown(`${prefix}\n\nTail updated`));

assert.equal(
  new CherryStream()
    .setMarkdown('&copy; &amp; &#x1F600;')[0]
    .inlines.map((run) => run.text)
    .join(''),
  '© & 😀',
);
console.log(
  'Verified native component registration, rendering, interactions, component files and strict public types.',
);
