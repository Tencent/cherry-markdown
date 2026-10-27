import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const root = resolve(process.argv[2] || resolve(dirname(fileURLToPath(import.meta.url)), '../..'));
const components = resolve(root, 'dist/components');
const bridgeManifest = JSON.parse(readFileSync(resolve(root, 'dist/semantic-bridge.json'), 'utf8'));
assert.equal(bridgeManifest.schemaVersion, 1);
assert.equal(bridgeManifest.source, 'cherry-markdown/semantic');
const definitions = new Map();
const clipboard = [];
const previews = [];
for (const name of ['markdown', 'block', 'inlines']) {
  const directory = resolve(components, name);
  const config = JSON.parse(readFileSync(resolve(directory, 'index.json'), 'utf8'));
  const template = readFileSync(resolve(directory, 'index.wxml'), 'utf8');
  assert.doesNotMatch(template, /<(?:web-view|rich-text)\b/);
  for (const [tag] of template.matchAll(/<[^>]+wx:for="[^"]+"[^>]*>/g)) {
    assert.match(tag, /wx:key="id"/, `${name}: every native loop must use keyed items`);
  }
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

// Match HTML terminal <br> layout without mutating semantic/view data or removing real blank lines.
const inline = {
  data: {},
  setData(patch) {
    Object.assign(this.data, patch);
  },
};
const trailingBreaks = [
  { type: 'text', text: 'one' },
  { type: 'text', text: '\n' },
  { type: 'text', text: '\n' },
];
definitions.get('inlines').observers.nodes.call(inline, trailingBreaks);
assert.equal(inline.data.groups[0].runs.map((run) => run.text).join(''), 'one\n');
assert.equal(trailingBreaks.length, 3);
definitions
  .get('inlines')
  .observers.nodes.call(inline, [{ type: 'text', text: 'one' }, { type: 'text', text: '\n' }, { type: 'cursor' }]);
assert.equal(inline.data.groups[0].runs.at(-1).type, 'cursor');

// Exercise layout against actual built component definitions, including asynchronous stale queries.
const tableDefinition = definitions.get('block');
let naturalHeight = 60;
let deferred = false;
let measurements = 0;
const callbacks = [];
const table = {
  data: { ...tableDefinition.data, block: { type: 'table', header: [], rows: [{ cells: [{ id: 'cell' }] }] } },
  setData(patch, done) {
    Object.assign(this.data, patch);
    done?.();
  },
  createSelectorQuery() {
    measurements++;
    let callback;
    const query = {
      select(selector) {
        assert.equal(selector, '.md-table');
        return query;
      },
      boundingClientRect(value) {
        callback = value;
        return query;
      },
      exec() {
        if (deferred) callbacks.push(callback);
        else callback({ height: naturalHeight });
      },
    };
    return query;
  },
};
tableDefinition.observers.block.call(table, table.data.block);
assert.equal(measurements, 0, 'do not query before native nodes are ready');
tableDefinition.lifetimes.ready.call(table);
assert.equal(table.data.tableHeight, 60);
naturalHeight = 240.25;
tableDefinition.observers.block.call(table, table.data.block);
assert.equal(table.data.tableHeight, 241, 'new rows must be measured without the previous viewport constraint');
tableDefinition.methods.tableScrolled.call(table, { detail: { scrollLeft: 37 } });
tableDefinition.pageLifetimes.resize.call(table);
assert.equal(table.data.tableScrollLeft, 37);
const imageLayout = {
  currentTarget: { dataset: { cell: 'cell' } },
  detail: { id: 'inline-0', src: '/a.png', width: 100, height: 200 },
};
tableDefinition.methods.tableImageLoaded.call(table, imageLayout);
const afterImage = measurements;
tableDefinition.methods.tableImageLoaded.call(table, imageLayout);
assert.equal(measurements, afterImage, 'remounting a loaded image must not create a measure/remount loop');
deferred = true;
tableDefinition.methods.measureTable.call(table);
tableDefinition.observers.block.call(table, table.data.block);
callbacks.shift()({ height: 999 });
assert.equal(table.data.tableHeight, 0, 'ignore measurements from older content');
callbacks.shift()({ height: 125 });
assert.equal(table.data.tableHeight, 125);
tableDefinition.methods.measureTable.call(table);
tableDefinition.lifetimes.detached.call(table);
callbacks.shift()({ height: 777 });
assert.equal(table.data.tableHeight, 0, 'ignore measurements after unmount');

const detail = {
  data: { block: { type: 'detail', open: false }, detailOpen: false },
  setData(patch) {
    Object.assign(this.data, patch);
  },
};
tableDefinition.observers.block.call(detail, detail.data.block);
tableDefinition.methods.toggleDetail.call(detail);
assert.equal(detail.data.detailOpen, true);
tableDefinition.observers.block.call(detail, detail.data.block);
assert.equal(detail.data.detailOpen, true, 'streaming body updates retain user expansion');
const themed = {
  data: {},
  setData(patch) {
    Object.assign(this.data, patch);
  },
};
tableDefinition.observers.theme.call(themed, 'dark');
assert.match(themed.data.themeStyle, /--md-paragraph-color:/);

const inlineComponent = definitions.get('inlines');
let groups;
inlineComponent.observers.nodes.call(
  {
    setData(patch) {
      groups = patch.groups;
    },
  },
  [
    { type: 'text', text: 'same' },
    { type: 'text', text: 'same' },
    { type: 'image', src: '/a.png' },
  ],
);
assert.equal(new Set(groups.map((group) => group.id)).size, groups.length);
assert.equal(new Set(groups[0].runs.map((run) => run.id)).size, 2);

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

const {
  default: CherryStream,
  NativeMarkdownController,
  SEMANTIC_CORE_VERSION,
} = await import(pathToFileURL(resolve(root, 'dist/miniProgram.esm.js')).href);
assert.equal(SEMANTIC_CORE_VERSION, bridgeManifest.coreVersion);
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
