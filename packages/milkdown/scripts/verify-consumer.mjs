import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';
import { build as esbuild } from 'esbuild';
import { checkMissingMath } from './consumer-missing-math.mjs';
import { checkConsumerClipboard } from './consumer-clipboard.mjs';
import {
  checkConsumerClipboardGetter,
  checkConsumerCopyDestroy,
  checkConsumerCopyRace,
  checkConsumerInterceptedCopy,
  checkConsumerStaleFallback,
} from './consumer-copy-race.mjs';
import { checkConsumerLineEndings } from './consumer-line-endings.mjs';
import { checkConsumerCompoundSelection } from './consumer-compound-selection.mjs';
import { checkConsumerPointerCaret } from './consumer-pointer-caret.mjs';
import { checkConsumerComposition } from './consumer-composition.mjs';
import { checkConsumerNotification } from './consumer-notification.mjs';
import {
  checkConsumerEngineCleanup,
  checkConsumerFailureReentrant,
  checkConsumerRenderReentrant,
} from './consumer-render-reentrant.mjs';
import { checkConsumerEngineDestroy, checkConsumerEngineImageFailure } from './consumer-engine-destroy.mjs';
import { checkConsumerNestedDestroy, checkConsumerNestedReentrant } from './consumer-nested-reentrant.mjs';
import { checkConsumerEngineSecurity } from './consumer-engine-security.mjs';
import { checkConsumerLinkSecurity } from './consumer-link-security.mjs';
import { checkConsumerImageKeyboard } from './consumer-image-keyboard.mjs';
import { checkConsumerImageComposition } from './consumer-image-composition.mjs';
import {
  checkConsumerImageAddress,
  checkConsumerImageDestroy,
  checkConsumerImageFailure,
  checkConsumerImageIsolation,
  checkConsumerImageMetadata,
} from './consumer-image-destroy.mjs';
import {
  artifactRoot,
  npm,
  workspaceRoot,
  verifyArtifactManifest,
  verifyMilkdownTarball,
  verifyCherryTarball,
  verifyInstalledPackage,
  checkProseMirrorViewTree,
} from './consumer-artifacts.mjs';

const { values } = parseArgs({
  options: { artifacts: { type: 'string' }, release: { type: 'boolean' }, 'expected-version': { type: 'string' } },
});
const variant = values.release ? 'release' : 'planned';
if (!values.artifacts) {
  execFileSync(
    process.execPath,
    [fileURLToPath(new URL('./prepare-ci-artifacts.mjs', import.meta.url)), ...(values.release ? ['--release'] : [])],
    { stdio: 'inherit' },
  );
}
const artifacts = values.artifacts ? resolve(values.artifacts) : join(artifactRoot, variant);
verifyArtifactManifest(artifacts, `consumer-${variant}`);

const fixture = mkdtempSync(join(tmpdir(), 'cherry-milkdown-consumer-'));
console.log(`Consumer fixture: ${fixture}`);
const childEnv = { ...process.env, npm_config_cache: join(fixture, '.npm-cache') };
const unpacked = join(fixture, 'unpacked');
mkdirSync(unpacked);
const milkdownTarball = join(artifacts, 'milkdown.tgz');
const cherryTarball = join(artifacts, 'cherry.tgz');
const manifest = verifyMilkdownTarball(milkdownTarball, unpacked);
const expectedVersion =
  values['expected-version'] ??
  (values.release
    ? JSON.parse(readFileSync(join(workspaceRoot, 'packages/milkdown/package.json'), 'utf8')).version
    : undefined);
if (expectedVersion !== undefined && expectedVersion !== manifest.version)
  throw new Error(`Release version mismatch: expected ${expectedVersion}, packed ${manifest.version}.`);
const cherryManifest = verifyCherryTarball(cherryTarball);
function run(command, args) {
  if (command === 'npm')
    npm(args[0] === 'install' ? [...args, '--legacy-peer-deps=false', '--force=false'] : args, {
      cwd: fixture,
      env: childEnv,
      stdio: 'inherit',
    });
  else execFileSync(command, args, { cwd: fixture, env: childEnv, stdio: 'inherit' });
}
writeFileSync(join(fixture, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
// Install both tarballs exactly as a consumer would. The Milkdown package uses
// Cherry's public engine build and does not require a Cherry editor patch.
run('npm', [
  'install',
  '--ignore-scripts=false',
  '--strict-peer-deps',
  '--no-audit',
  '--no-fund',
  milkdownTarball,
  cherryTarball,
  ...Object.entries(manifest.peerDependencies)
    .filter(([name]) => name !== 'cherry-markdown' && !manifest.peerDependenciesMeta?.[name]?.optional)
    .map(([name, version]) => `${name}@${version}`),
  'react@18.3.1',
  'react-dom@18.3.1',
  '@types/react@18.3.18',
  '@types/react-dom@18.3.5',
  'typescript@~5.9.3',
  'vite@8.2.1',
]);
// Frameworks may evaluate module imports on the server before mounting the
// editor in a browser. Importing must not require window or document.
run(process.execPath, [
  '--input-type=module',
  '-e',
  "import editor, { cherryMilkdown } from '@cherry-markdown/milkdown'; import { echarts, tableChart } from '@cherry-markdown/milkdown/echarts'; if (editor !== cherryMilkdown || typeof editor !== 'function' || typeof echarts !== 'function' || typeof tableChart !== 'function') throw new Error('Unexpected package entry');",
]);
writeFileSync(
  join(fixture, 'index.html'),
  '<!doctype html><meta charset="utf-8"><link rel="icon" href="data:,"><div id="root"></div><script type="module" src="/main.tsx"></script>',
);
writeFileSync(
  join(fixture, 'tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      lib: ['ES2022', 'DOM'],
      module: 'ESNext',
      moduleResolution: 'Bundler',
      jsx: 'react-jsx',
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      noUncheckedSideEffectImports: false,
    },
    include: ['main.tsx'],
  }),
);
const prismFixture =
  '\n\n```typescript\nconst answer: number = 42;\n```\n\n```json\n{"answer":42}\n```\n\n```python\nprint("hello")\n```';
function writeEntry(charts = false, capabilities = false) {
  writeFileSync(
    join(fixture, 'main.tsx'),
    `
import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import CherryEngine from 'cherry-markdown/dist/cherry-markdown.engine.core.esm.js';
import { cherryMilkdown, type CherryMilkdownErrorContext, type CherryMilkdownInstance } from '@cherry-markdown/milkdown';
import { editorViewCtx, parserCtx, serializerCtx } from '@milkdown/kit/core';
import { Plugin } from '@milkdown/kit/prose/state';
import { $prose } from '@milkdown/kit/utils';
${
  charts
    ? `import { echarts, tableChart } from '@cherry-markdown/milkdown/echarts';
import * as chartLibrary from 'echarts';
chartLibrary.registerMap('consumer-map', {
  type: 'FeatureCollection', features: [{ type: 'Feature', properties: { name: '北京市' },
    geometry: { type: 'Polygon', coordinates: [[[116,39],[117,39],[117,40],[116,40],[116,39]]] } }],
});`
    : ''
}
import '@cherry-markdown/milkdown/style.css';
${capabilities ? "import 'mathlive/fonts.css';" : ''}
declare global { interface Window { consumerEditor?: CherryMilkdownInstance; consumerNestedEditor?: CherryMilkdownInstance; consumerUploadEditor?: CherryMilkdownInstance; consumerCleanupEditor?: CherryMilkdownInstance; createConsumerNested: () => Promise<void>; createConsumerUpload: () => Promise<void>; createConsumerEngineCleanup: () => Promise<void>; createConsumerParseProbe: () => Promise<void>; consumerCreateErrorProbe: () => Promise<{ reported: string; rejected: string; host: string }>; consumerStorageDenied?: boolean; consumerStorageProbe: () => Promise<{ reported: string; rejected: string; host: string }>; consumerCleanupCount: number; consumerCleanupErrors: string[]; consumerUploadFinish?: (url: string) => void; consumerUploadReject?: (error: Error) => void; consumerUploadSignal?: AbortSignal; expectedMathError?: boolean; consumerErrors?: Array<{ phase: string; message: string }>; consumerChanges: string[]; consumerRenderReenter?: boolean; consumerNestedReenter?: boolean; consumerNestedDestroy?: boolean; consumerNestedDestroyed?: boolean; consumerNestedCleanups: number; consumerNestedCalls: boolean[]; } }
window.consumerStorageProbe = async () => {
  const root = document.getElementById('root')!;
  root.textContent = 'Host content';
  let reported = '';
  let rejected = '';
  try {
    await cherryMilkdown({ root, onError: (error, phase) => { reported = phase + ': ' + String(error); } });
  } catch (error) { rejected = String(error); }
  const host = root.textContent ?? '';
  window.consumerEditor = await cherryMilkdown({ root, value: 'Before', engine: { makeHtml: (source: string) => source } });
  return { reported, rejected, host };
};
window.createConsumerParseProbe = async () => {
  const state = window as Window & { consumerParseEditor?: CherryMilkdownInstance; consumerParseFail?: (after?: number) => void; consumerParseRestore?: () => void; consumerPendingRecoveryProbe?: () => { previous: string; current: string }; consumerSerializerReenter?: () => void; consumerCountSerializer?: () => void; consumerSerializerCalls?: number; consumerParseErrors?: string[]; consumerParseChanges?: string[]; consumerExternalReenter?: boolean; consumerExternalReject?: boolean; consumerExternalAppend?: boolean; consumerViewFailure?: boolean; consumerDestroyExternal?: boolean; consumerExternalDestruction?: Promise<void>; consumerRecovery?: CherryMilkdownErrorContext; consumerThrowParseReporter?: boolean };
  const root = document.createElement('div');
  root.className = 'consumer-parse-probe';
  document.body.append(root);
  state.consumerParseErrors = [];
  state.consumerParseChanges = [];
  state.consumerThrowParseReporter = true;
  const probe = $prose((ctx) => new Plugin({ view() {
    const original = ctx.get(serializerCtx);
    state.consumerCountSerializer = () => {
      state.consumerSerializerCalls = 0;
      ctx.set(serializerCtx, (doc) => { state.consumerSerializerCalls! += 1; return original(doc); });
    };
    const parse = ctx.get(parserCtx);
    ctx.set(parserCtx, (source) => {
      if (state.consumerExternalReject && source === 'Rejected') throw new Error('Invalid replacement');
      return parse(source);
    });
    state.consumerParseFail = (after = 0) => {
      let calls = 0;
      ctx.set(serializerCtx, (doc) => {
        if (calls++ < after) return original(doc);
        throw new Error('Serialization failed');
      });
    };
    state.consumerParseRestore = () => ctx.set(serializerCtx, original);
    state.consumerPendingRecoveryProbe = () => {
      const view = ctx.get(editorViewCtx);
      view.dispatch(view.state.tr.insertText('!', view.state.doc.content.size - 1));
      let broken = false;
      ctx.set(serializerCtx, (doc) => {
        if (doc.textContent === 'External!') broken = true;
        if (broken) throw new Error('Persistent serialization failure');
        return original(doc);
      });
      state.consumerExternalAppend = true;
      state.consumerParseEditor!.setMarkdown('External');
      const previous = state.consumerRecovery!.getPreviousMarkdown();
      ctx.set(serializerCtx, original);
      state.consumerExternalAppend = false;
      return { previous, current: state.consumerParseEditor!.getMarkdown() };
    };
    state.consumerSerializerReenter = () => {
      let reenter = true;
      ctx.set(serializerCtx, (doc) => {
        if (reenter) { reenter = false; state.consumerParseEditor?.setMarkdown('Latest', { emit: false }); }
        return original(doc);
      });
    };
    return { update(view) {
      if (state.consumerViewFailure && view.state.doc.textContent === 'ViewFailure') {
        state.consumerViewFailure = false;
        throw new Error('Consumer plugin view failed');
      }
      if (state.consumerDestroyExternal && view.state.doc.textContent === 'Item') {
        state.consumerDestroyExternal = false;
        state.consumerExternalDestruction = state.consumerParseEditor?.destroy();
      }
      if (state.consumerExternalReenter && view.state.doc.textContent.includes('Middle')) {
        state.consumerExternalReenter = false;
        state.consumerParseEditor?.setMarkdown(state.consumerExternalReject ? 'Rejected' : 'Latest');
      }
    } };
  }, appendTransaction(_transactions, _oldState, next) {
    if (!state.consumerExternalAppend || next.doc.textContent !== 'External') return null;
    return next.tr.insertText('!', next.doc.content.size - 1);
  } }));
  state.consumerParseEditor = await cherryMilkdown({ root, value: 'Before', plugins: [probe], debounce: 250,
    onChange: ({markdown}) => state.consumerParseChanges!.push(markdown),
    onError: (error, phase, context) => { state.consumerRecovery = context; state.consumerParseErrors!.push(phase + ': ' + String(error)); if (state.consumerThrowParseReporter) throw new Error('Reporter failed'); },
  });
};
window.consumerCreateErrorProbe = async () => {
  const root = document.createElement('div');
  root.textContent = 'Host content';
  document.body.append(root);
  let reported = '';
  let rejected = '';
  try {
    await cherryMilkdown({ root, engine: {}, onError: (error, phase) => {
      reported = phase + ': ' + String(error);
      throw new Error('Reporter failed');
    } });
  } catch (error) {
    rejected = String(error);
  }
  const host = root.textContent ?? '';
  root.remove();
  return { reported, rejected, host };
};
(window as Window & { consumerEngineDestroy?: (image: boolean) => Promise<{ before: string | null; remaining: number }> }).consumerEngineDestroy = async (image) => {
  const root = document.createElement('div');
  document.body.append(root);
  let destroyOnRender = false;
  let destruction: Promise<void> | undefined;
  let editor: CherryMilkdownInstance;
  const engine = { makeHtml: () => {
    if (destroyOnRender) {
      destroyOnRender = false;
      destruction = editor.destroy();
      return image ? '<img src="https://example.com/stale.png">' : '<div>stale</div>';
    }
    return image ? '<img src="https://example.com/initial.png">' : '<div>initial</div>';
  } };
  try {
    editor = await cherryMilkdown({ root, engine, value: image ? '![old](https://example.com/old.png)' : '<div>\\nOld\\n</div>' });
    const target = root.querySelector(image ? '.ProseMirror img:not(.ProseMirror-separator)' : '.cherry-embed__preview');
    if (!target) throw new Error('Missing engine preview');
    destroyOnRender = true;
    editor.setMarkdown(image ? '![new](https://example.com/new.png)' : '<div>\\nNew\\n</div>');
    const before = image ? target.getAttribute('src') : target.textContent;
    if (!destruction) throw new Error('Engine did not request destruction');
    await destruction;
    return { before, remaining: root.querySelectorAll('.ProseMirror').length };
  } finally {
    root.remove();
  }
};
(window as Window & { consumerEngineImageFailure?: () => Promise<{ original: string | null; unsafe: string | null; recovered: string | null; markdown: string; errors: string[] }> }).consumerEngineImageFailure = async () => {
  const root = document.createElement('div');
  document.body.append(root);
  const errors: string[] = [];
  let fail = true;
  let editor: CherryMilkdownInstance | undefined;
  try {
    editor = await cherryMilkdown({
      root,
      value: '![picture](https://example.com/original.png)',
      engine: { makeHtml: () => {
        if (fail) throw new Error('Image engine failed');
        return '<img src="https://example.com/recovered.png">';
      } },
      onError: (error, phase) => errors.push(phase + ': ' + String(error)),
    });
    const image = () => root.querySelector('.ProseMirror img:not(.ProseMirror-separator)');
    const original = image()?.getAttribute('src') ?? null;
    editor.setMarkdown('![unsafe](data:text/html,unsafe)');
    if (!image()) throw new Error('Unsafe image probe did not create an image node');
    const unsafe = image()?.getAttribute('src') ?? null;
    fail = false;
    editor.setMarkdown('Text\\n\\n![picture](https://example.com/updated.png)');
    return { original, unsafe, recovered: image()?.getAttribute('src') ?? null, markdown: editor.getMarkdown(), errors };
  } finally {
    await editor?.destroy();
    root.remove();
  }
};
window.createConsumerEngineCleanup = async () => {
  const root = document.createElement('div');
  root.className = 'consumer-cleanup-test';
  document.body.append(root);
  window.consumerCleanupCount = 0;
  window.consumerCleanupErrors = [];
  window.consumerCleanupEditor = await cherryMilkdown({
    root,
    value: ${JSON.stringify('```consumer-cleanup\nFirst\n```\n\n```consumer-cleanup\nSecond\n```')},
    engine: { makeHtml: (source: string) => source, destroyRenderedContent: () => { throw new Error('Engine cleanup failed'); } },
    renderers: { 'consumer-cleanup': ({ container, source }) => {
      container.textContent = source;
      return () => { window.consumerCleanupCount += 1; };
    } },
    onError: (error, phase) => {
      window.consumerCleanupErrors.push(phase + ': ' + String(error));
      throw new Error('Error reporter failed');
    },
  });
};
window.createConsumerUpload = async () => {
  const root = document.createElement('div');
  root.className = 'consumer-upload-test';
  document.body.append(root);
  window.consumerUploadEditor = await cherryMilkdown({
    root,
    value: '![original](https://example.com/consumer-original.png)',
    fileUpload: (_file, finish, { signal }) => {
      window.consumerUploadFinish = finish;
      window.consumerUploadSignal = signal;
      return new Promise<void>((_resolve, reject) => { window.consumerUploadReject = reject; });
    },
  });
};
window.createConsumerNested = async () => {
  const root = document.createElement('div');
  root.className = 'consumer-nested-test';
  document.body.append(root);
  window.consumerNestedEditor = await cherryMilkdown({
    root,
    renderers: { tableChart: ({ signal }) => {
      if (window.consumerNestedReenter) {
        (window.consumerNestedCalls ??= []).push(signal?.aborted ?? false);
        window.consumerNestedReenter = false;
        if (window.consumerNestedDestroy) {
          void window.consumerNestedEditor?.destroy().then(() => { window.consumerNestedDestroyed = true; });
        } else {
          window.consumerNestedEditor?.setMarkdown('Replacement', { emit: false });
        }
      } else if (window.consumerNestedCalls?.length) {
        window.consumerNestedCalls.push(signal?.aborted ?? false);
      }
      return () => { window.consumerNestedCleanups = (window.consumerNestedCleanups ?? 0) + 1; };
    } },
  });
};
function App() {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current) return;
    let disposed = false;
    let editor: CherryMilkdownInstance | undefined;
    void cherryMilkdown({
      root: el.current,
      engine: new CherryEngine({}),
      onChange: ({ markdown }) => (window.consumerChanges ??= []).push(markdown),
      onError: (error, phase) => {
        if (window.expectedMathError) (window.consumerErrors ??= []).push({ phase, message: String(error) });
        else console.error(phase, error);
      },
      value: ${JSON.stringify(
        (capabilities
          ? '# Capabilities\n\n```mermaid\ngraph LR\nA-->B\n```\n\n$$\nx^2\n$$'
          : charts
            ? '# Published package\n\n| :map:{"title":"Published map","mapDataSource":"consumer-map"} | Value |\n| --- | --- |\n| 北京 | 10 |\n\n| :line:{"title":"Published chart"} | Jan | Feb |\n| --- | --- | --- |\n| Sales | 1 | 2 |\n\n```echarts\n{animation:false,title:{text:"Code chart"},xAxis:{data:["Jan","Feb"]},yAxis:{},series:[{type:"line",data:[1,2]}]}\n```'
            : '# Published package') + prismFixture,
      )},
      ${
        charts
          ? 'renderers: { echarts, tableChart },'
          : `renderers: { 'consumer-race': ({ source, container, signal }) => {
              if (source === 'Failure' && (window as Window & { consumerFailureReenter?: boolean }).consumerFailureReenter) {
                signal?.addEventListener('abort', () => window.consumerEditor?.setMarkdown(${JSON.stringify('```consumer-race\nLatest\n```')}, { emit: false }), { once: true });
                return Promise.reject(new Error('Obsolete render failed'));
              }
              container.textContent = source;
              return () => {
                if (source === 'Old' && window.consumerRenderReenter) {
                  window.consumerRenderReenter = false;
                  window.consumerEditor?.setMarkdown(${JSON.stringify('```consumer-race\nLatest\n```')}, { emit: false });
                }
              };
            } },`
      }
    }).then((instance) => {
      if (disposed) return instance.destroy();
      editor = instance;
      window.consumerEditor = instance;
    });
    return () => {
      disposed = true;
      void editor?.destroy();
    };
  }, []);
  return <div ref={el} />;
}
const root = document.getElementById('root');
if (!root) throw new Error('Missing React root.');
if (!window.consumerStorageDenied) createRoot(root).render(<App />);
`,
  );
}
function build(label) {
  verifyInstalledPackage(unpacked, join(fixture, 'node_modules/@cherry-markdown/milkdown'));
  const tree = JSON.parse(
    npm(['ls', 'prosemirror-view', '--all', '--json'], { cwd: fixture, env: childEnv, encoding: 'utf8' }),
  );
  checkProseMirrorViewTree(tree);
  run('npm', ['ls', '@cherry-markdown/milkdown', 'cherry-markdown', '@milkdown/kit']);
  run(process.execPath, [join(fixture, 'node_modules/typescript/bin/tsc'), '--noEmit']);
  run(process.execPath, [join(fixture, 'node_modules/vite/bin/vite.js'), 'build', '--logLevel', 'warn']);
  console.log(`Consumer build passed: ${label}`);
}
async function checkRuntime(label, mode = 'charts', outDir = 'dist', storageDenied = false) {
  verifyInstalledPackage(unpacked, join(fixture, 'node_modules/@cherry-markdown/milkdown'));
  const { preview } = await import(pathToFileURL(join(fixture, 'node_modules/vite/dist/node/index.js')).href);
  const server = await preview({
    root: fixture,
    configFile: false,
    build: { outDir },
    preview: { host: '127.0.0.1', port: 0, strictPort: true },
  });
  let browser;
  let page;
  const errors = [];
  try {
    browser = await chromium.launch();
    page = await browser.newPage();
    if (storageDenied) {
      await page.addInitScript(() => {
        window.consumerStorageDenied = true;
        Object.defineProperty(window, 'localStorage', {
          configurable: true,
          get() {
            throw new DOMException('Storage access denied', 'SecurityError');
          },
        });
      });
    }
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const { port } = server.httpServer.address();
    await page.goto(`http://127.0.0.1:${port}/`);
    if (storageDenied) {
      const result = await page.evaluate(() => window.consumerStorageProbe());
      assert.equal(result.reported, 'create: SecurityError: Storage access denied');
      assert.equal(result.rejected, 'SecurityError: Storage access denied');
      assert.equal(result.host, 'Host content');
      await page.locator('.ProseMirror p').click();
      await page.keyboard.press('End');
      await page.keyboard.type(' added');
      await page.waitForFunction(() => window.consumerEditor.getMarkdown() === 'Before added');
      await page.keyboard.press('ControlOrMeta+z');
      await page.waitForFunction(() => window.consumerEditor.getMarkdown() === 'Before');
      await page.evaluate(() => window.consumerEditor.destroy());
      if (errors.length) throw new Error(errors.join('\n'));
      console.log(`Consumer storage-denied runtime passed: ${label}`);
      return;
    }
    await page.waitForFunction(() => Boolean(window.consumerEditor));
    if (mode === 'capabilities') {
      await page.locator('[data-type="mermaid"] svg').waitFor();
      await page.waitForFunction(() => Boolean(customElements.get('math-field')));
      await page.waitForFunction(() => document.querySelector('math-field')?.value === 'x^2');
      await page.getByRole('button', { name: '编辑块公式源码' }).click();
      await page.locator('.cherry-math__source code').fill('x^3');
      await page.waitForFunction(() => window.consumerEditor.getMarkdown().includes('x^3'));
      await page.waitForFunction(() => document.querySelector('math-field')?.value === 'x^3');
    } else if (mode === 'base') {
      await page.locator('.ProseMirror h1').filter({ hasText: 'Published package' }).waitFor();
      const createFailure = await page.evaluate(() => window.consumerCreateErrorProbe());
      assert.equal(
        createFailure.reported,
        'create: TypeError: cherryMilkdown requires an engine with makeHtml(markdown).',
      );
      assert.equal(createFailure.rejected, 'TypeError: cherryMilkdown requires an engine with makeHtml(markdown).');
      assert.equal(createFailure.host, 'Host content');
      const pageErrors = [];
      const recordPageError = (error) => pageErrors.push(error.message);
      page.on('pageerror', recordPageError);
      try {
        await page.evaluate(() => window.createConsumerParseProbe());
        await page.evaluate(() => {
          window.consumerCountSerializer();
          window.consumerParseEditor.setMarkdown('Before');
        });
        assert.equal(await page.evaluate(() => window.consumerSerializerCalls), 1);
        await page.waitForFunction(() => window.consumerParseChanges?.at(-1) === 'Before');
        await page.evaluate(() => {
          window.consumerParseRestore();
          window.consumerParseChanges = [];
        });
        await page.locator('.consumer-parse-probe .ProseMirror p').click();
        await page.keyboard.press('End');
        await page.keyboard.type('1');
        await page.evaluate(() => window.consumerParseFail());
        await page.keyboard.type('2');
        await page.waitForFunction(() => window.consumerParseErrors?.includes('parse: Error: Serialization failed'));
        await page.waitForTimeout(300);
        assert.deepEqual(await page.evaluate(() => window.consumerParseChanges), []);
        await page.evaluate(() => window.consumerParseRestore());
        assert.equal(await page.evaluate(() => window.consumerParseEditor.getMarkdown()), 'Before12');
        await page.waitForFunction(() => window.consumerParseChanges?.at(-1) === 'Before12');
        await page.evaluate(() => {
          window.consumerParseEditor.setMarkdown('Before', { emit: false });
          window.consumerParseChanges = [];
          window.consumerParseErrors = [];
        });
        await page.locator('.consumer-parse-probe .ProseMirror p').click();
        await page.keyboard.press('End');
        await page.evaluate(() => window.consumerSerializerReenter());
        await page.keyboard.type('!');
        await page.waitForFunction(() => window.consumerParseEditor.getMarkdown() === 'Latest');
        await page.waitForTimeout(300);
        assert.deepEqual(await page.evaluate(() => window.consumerParseChanges), []);
        await page.evaluate(() => {
          window.consumerParseRestore();
          window.consumerParseEditor.setMarkdown('Before', { emit: false });
          window.consumerParseChanges = [];
          window.consumerParseErrors = [];
        });
        await page.locator('.consumer-parse-probe .ProseMirror p').click();
        await page.keyboard.press('End');
        await page.evaluate(() => window.consumerParseFail());
        await page.keyboard.type('!');
        await page.waitForFunction(() => window.consumerParseErrors?.includes('parse: Error: Serialization failed'));
        await page.evaluate(() => window.consumerParseRestore());
        await page.keyboard.type('?');
        await page.waitForFunction(() => window.consumerParseChanges?.at(-1) === 'Before!?');
        assert.equal(await page.evaluate(() => window.consumerParseEditor.getMarkdown()), 'Before!?');
        await page.keyboard.type('+');
        await page.evaluate(() => {
          window.consumerThrowParseReporter = false;
          window.consumerParseErrors = [];
          window.consumerParseFail();
          window.consumerParseEditor.setMarkdown('External');
          window.consumerParseRestore();
        });
        assert.equal(await page.evaluate(() => window.consumerParseEditor.getMarkdown()), 'Before!?+');
        assert.deepEqual(await page.evaluate(() => window.consumerParseErrors), ['parse: Error: Serialization failed']);
        await page.waitForFunction(() => window.consumerParseChanges?.at(-1) === 'Before!?+');
        await page.keyboard.type('x');
        await page.evaluate(() => {
          window.consumerParseErrors = [];
          window.consumerParseFail(1);
          window.consumerParseEditor.setMarkdown('External');
          window.consumerParseRestore();
        });
        assert.equal(await page.evaluate(() => window.consumerParseEditor.getMarkdown()), 'Before!?+x');
        assert.deepEqual(await page.evaluate(() => window.consumerParseErrors), ['parse: Error: Serialization failed']);
        await page.waitForFunction(() => window.consumerParseChanges?.at(-1) === 'Before!?+x');
        await page.evaluate(() => {
          window.consumerParseChanges = [];
          window.consumerParseErrors = [];
          window.consumerExternalAppend = true;
          window.consumerParseFail(1);
          window.consumerParseEditor.setMarkdown('External');
          window.consumerRecoveredWhileFailing = window.consumerRecovery.getPreviousMarkdown();
          window.consumerParseRestore();
          window.consumerExternalAppend = false;
        });
        assert.equal(await page.evaluate(() => window.consumerParseEditor.getMarkdown()), 'External!');
        assert.equal(await page.evaluate(() => window.consumerRecoveredWhileFailing), 'Before!?+x');
        assert.equal(await page.evaluate(() => window.consumerRecovery.getPreviousMarkdown()), 'Before!?+x');
        await page.waitForFunction(() => window.consumerParseChanges?.at(-1) === 'External!');
        assert.deepEqual(await page.evaluate(() => window.consumerParseChanges), ['External!']);
        assert.deepEqual(await page.evaluate(() => window.consumerParseErrors), ['parse: Error: Serialization failed']);
        await page.evaluate(() => {
          window.consumerParseEditor.setMarkdown('Before', { emit: false });
          window.consumerParseChanges = [];
          window.consumerParseErrors = [];
          window.consumerExternalAppend = true;
          window.consumerParseEditor.setMarkdown('External', { emit: false });
          window.consumerExternalAppend = false;
        });
        assert.equal(await page.evaluate(() => window.consumerParseEditor.getMarkdown()), 'External!');
        await page.waitForFunction(() => window.consumerParseChanges?.at(-1) === 'External!');
        assert.deepEqual(await page.evaluate(() => window.consumerParseChanges), ['External!']);
        assert.deepEqual(await page.evaluate(() => window.consumerParseErrors), []);
        await page.evaluate(() => {
          window.consumerThrowParseReporter = false;
          window.consumerParseChanges = [];
          window.consumerExternalReenter = true;
          window.consumerParseEditor.setMarkdown('Middle');
        });
        assert.equal(await page.evaluate(() => window.consumerParseEditor.getMarkdown()), 'Latest');
        await page.waitForFunction(() => window.consumerParseChanges?.at(-1) === 'Latest');
        assert.deepEqual(await page.evaluate(() => window.consumerParseChanges), ['Latest']);
        await page.evaluate(() => {
          window.consumerParseChanges = [];
          window.consumerParseErrors = [];
          window.consumerExternalReject = true;
          window.consumerExternalReenter = true;
          window.consumerParseEditor.setMarkdown('Middle');
        });
        assert.equal(await page.evaluate(() => window.consumerParseEditor.getMarkdown()), 'Middle');
        await page.waitForFunction(() => window.consumerParseChanges?.at(-1) === 'Middle');
        assert.deepEqual(await page.evaluate(() => window.consumerParseChanges), ['Middle']);
        assert.deepEqual(await page.evaluate(() => window.consumerParseErrors), ['parse: Error: Invalid replacement']);
        const originalConsumer = await page.evaluate(() => window.consumerEditor.getMarkdown());
        await page.evaluate(() => {
          window.consumerChanges = [];
          window.consumerParseChanges = [];
          window.consumerEditor.setMarkdown('Other', { emit: false });
        });
        await page.locator('#root .ProseMirror p').click();
        await page.keyboard.press('End');
        await page.keyboard.type('?');
        await page.locator('.consumer-parse-probe .ProseMirror p').click();
        await page.keyboard.press('End');
        await page.keyboard.type('!');
        await page.evaluate(() => {
          window.consumerParseFail(1);
          window.consumerParseEditor.setMarkdown('External');
          window.consumerParseRestore();
        });
        assert.equal(await page.evaluate(() => window.consumerParseEditor.getMarkdown()), 'Middle!');
        assert.equal(await page.evaluate(() => window.consumerEditor.getMarkdown()), 'Other?');
        await page.waitForFunction(() => window.consumerParseChanges?.at(-1) === 'Middle!');
        await page.waitForFunction(() => window.consumerChanges?.at(-1) === 'Other?');
        await page.locator('#root .ProseMirror p').click();
        await page.keyboard.press('ControlOrMeta+z');
        await page.waitForFunction(() => window.consumerEditor.getMarkdown() === 'Other');
        assert.equal(await page.evaluate(() => window.consumerParseEditor.getMarkdown()), 'Middle!');
        await page.evaluate((value) => window.consumerEditor.setMarkdown(value, { emit: false }), originalConsumer);
        await page.evaluate(() => {
          window.consumerParseErrors = [];
          window.consumerParseChanges = [];
          window.consumerViewFailure = true;
          window.consumerParseEditor.setMarkdown('ViewFailure');
        });
        assert.deepEqual(await page.evaluate(() => window.consumerParseErrors), ['parse: Error: Consumer plugin view failed']);
        assert.equal(await page.evaluate(() => window.consumerRecovery.getPreviousMarkdown()), 'Middle!');
        assert.equal(await page.evaluate(() => window.consumerParseEditor.getMarkdown()), 'ViewFailure');
        await page.waitForFunction(() => window.consumerParseChanges?.at(-1) === 'ViewFailure');
        await page.evaluate(() => {
          window.consumerParseEditor.setMarkdown('Before', { emit: false });
          window.consumerParseChanges = [];
          window.consumerParseErrors = [];
        });
        assert.deepEqual(await page.evaluate(() => window.consumerPendingRecoveryProbe()), {
          previous: 'Before!',
          current: 'External!',
        });
        assert.deepEqual(await page.evaluate(() => window.consumerParseErrors), ['parse: Error: Persistent serialization failure']);
        await page.waitForFunction(() => window.consumerParseChanges?.at(-1) === 'External!');
        const nestedSource = '* Outer\n  + Inner\n';
        await page.evaluate((value) => {
          window.consumerParseEditor.setMarkdown(value, { emit: false });
          window.consumerParseChanges = [];
        }, nestedSource);
        await page.locator('.consumer-parse-probe .ProseMirror li p').filter({ hasText: 'Inner' }).last().click();
        await page.keyboard.press('End');
        await page.keyboard.type('!');
        await page.waitForFunction(() => window.consumerParseEditor.getMarkdown() === '* Outer\n  + Inner!\n');
        await page.waitForFunction(() => window.consumerParseChanges?.at(-1) === '* Outer\n  + Inner!\n');
        await page.keyboard.press('ControlOrMeta+z');
        await page.waitForFunction((value) => window.consumerParseEditor.getMarkdown() === value, nestedSource);
        await page.keyboard.press('ControlOrMeta+Shift+z');
        await page.waitForFunction(() => window.consumerParseEditor.getMarkdown() === '* Outer\n  + Inner!\n');
        await page.keyboard.press('ControlOrMeta+z');
        await page.waitForFunction((value) => window.consumerParseEditor.getMarkdown() === value, nestedSource);
        const destroyedMarkdown = await page.evaluate(async () => {
          window.consumerParseChanges = [];
          window.consumerDestroyExternal = true;
          window.consumerParseEditor.setMarkdown('* Item\r\n\r\n');
          if (!window.consumerExternalDestruction) throw new Error('Plugin did not destroy the editor');
          await window.consumerExternalDestruction;
          return window.consumerParseEditor.getMarkdown();
        });
        assert.equal(destroyedMarkdown, '* Item\r\n\r\n');
        assert.deepEqual(await page.evaluate(() => window.consumerParseChanges), []);
        assert.deepEqual(pageErrors, []);
      } finally {
        page.off('pageerror', recordPageError);
        await page.evaluate(async () => {
          await window.consumerParseEditor?.destroy();
          document.querySelector('.consumer-parse-probe')?.remove();
        });
      }
      for (const language of ['typescript', 'json', 'python'])
        await page.locator(`pre.language-${language} .token`).first().waitFor();
      await page.evaluate(() => window.consumerEditor.setMarkdown('# Base\n\nEditable'));
      await page.locator('.ProseMirror p').click();
      await page.keyboard.press('End');
      await page.keyboard.type(' typed');
      await page.waitForFunction(() => window.consumerEditor.getMarkdown().includes('Editable typed'));
      await checkMissingMath(page);
      await checkConsumerClipboard(page);
      await checkConsumerLineEndings(page);
      await checkConsumerCompoundSelection(page);
      await checkConsumerPointerCaret(page);
      await checkConsumerComposition(page);
      await checkConsumerNotification(page);
      await checkConsumerImageKeyboard(page);
      await checkConsumerImageComposition(page);
      await checkConsumerEngineSecurity(page);
      await checkConsumerLinkSecurity(page);
      await checkConsumerRenderReentrant(page);
      await checkConsumerFailureReentrant(page);
      await checkConsumerNestedReentrant(page);
      await checkConsumerNestedDestroy(page);
      await checkConsumerImageIsolation(page);
      await checkConsumerImageAddress(page);
      await checkConsumerImageMetadata(page);
      await checkConsumerImageFailure(page);
      await checkConsumerImageDestroy(page);
      await checkConsumerEngineCleanup(page);
      await checkConsumerEngineDestroy(page);
      await checkConsumerEngineImageFailure(page);
      await checkConsumerClipboardGetter(page);
      await checkConsumerInterceptedCopy(page);
      await checkConsumerCopyRace(page);
      await checkConsumerStaleFallback(page);
      await checkConsumerCopyDestroy(page);
    } else {
      try {
        await page.locator('.ProseMirror .cherry-echarts-wrapper svg').nth(1).waitFor();
      } catch (error) {
        throw new Error(`${label}: ${errors.join('\n')}\n${await page.locator('body').innerText()}`, { cause: error });
      }
      if (!(await page.locator('.cherry-echarts-wrapper').nth(1).textContent()).includes('Published chart')) {
        throw new Error('Cherry table chart did not render its configured title.');
      }
      for (const [language, type, text] of [
        ['typescript', 'builtin', 'number'],
        ['json', 'property', '"answer"'],
        ['python', 'keyword', 'print'],
      ]) {
        const token = page
          .locator(`.cherry-milkdown-code-block pre.language-${language} .token.${type}`)
          .filter({ hasText: text });
        await token.waitFor();
        if ((await token.count()) !== 1) throw new Error(`Packed Prism ${language} token mismatch.`);
      }
      await page.locator('.cherry-echarts-wrapper[data-map-status=success] svg').waitFor();
      await page.locator('.cherry-echarts-wrapper svg text').filter({ hasText: 'Published map' }).waitFor();
      const title = page.locator('.cherry-echarts-codeblock-wrapper svg text').filter({ hasText: 'Code chart' });
      await title.waitFor();
      const before = await title.getAttribute('fill');
      if (!before) throw new Error('Missing code-chart theme baseline.');
      const original = await page.evaluate(() => window.consumerEditor.getMarkdown());
      await page.evaluate(() => window.consumerEditor.setTheme('dark'));
      await page.waitForFunction((color) => {
        const title = [...document.querySelectorAll('.cherry-echarts-codeblock-wrapper svg text')].find(
          (el) => el.textContent === 'Code chart',
        );
        return Boolean(title) && title.getAttribute('fill') !== color;
      }, before);
      await page.evaluate(() => window.consumerEditor.setTheme('default'));
      await page.waitForFunction((color) => {
        const title = [...document.querySelectorAll('.cherry-echarts-codeblock-wrapper svg text')].find(
          (el) => el.textContent === 'Code chart',
        );
        return title?.getAttribute('fill') === color;
      }, before);
      if ((await page.evaluate(() => window.consumerEditor.getMarkdown())) !== original)
        throw new Error('Theme switching changed consumer Markdown.');
    }
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(`Consumer ${mode} runtime passed: ${label}`);
  } catch (error) {
    const output = resolve(artifactRoot, '../diagnostics');
    mkdirSync(output, { recursive: true });
    if (page) await page.screenshot({ path: join(output, `${variant}-${mode}.png`), fullPage: true }).catch(() => {});
    writeFileSync(
      join(output, `${variant}-${mode}.json`),
      JSON.stringify({ label, error: String(error), errors }, null, 2),
    );
    throw error;
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.httpServer.close(resolve));
  }
}

// No capability peers were explicitly installed. Cherry can bring Mermaid
// transitively; check MathLive's actual absence instead of inferring it from
// the install arguments. A JS-only build would miss unconditional font imports.
if (existsSync(join(fixture, 'node_modules/mathlive')))
  throw new Error('The base stylesheet probe requires MathLive to be absent.');
writeEntry();
build('workspace Cherry, MathLive absent');
await checkRuntime('workspace Cherry, MathLive absent', 'base');
// Exercise the packed entry with esbuild's default side-effect handling. A
// static build can succeed even when a tree-shaken Milkdown schema crashes
// during module initialization, so this must include a browser editing check.
await esbuild({
  absWorkingDir: fixture,
  entryPoints: ['main.tsx'],
  outdir: 'esbuild-dist',
  bundle: true,
  format: 'esm',
  external: ['mathlive', 'mermaid', 'echarts'],
  loader: { '.eot': 'file', '.svg': 'file', '.ttf': 'file', '.woff': 'file', '.woff2': 'file' },
  logLevel: 'silent',
});
writeFileSync(
  join(fixture, 'esbuild-dist/index.html'),
  '<!doctype html><meta charset="utf-8"><link rel="icon" href="data:,"><link rel="stylesheet" href="/main.css"><div id="root"></div><script type="module" src="/main.js"></script>',
);
await checkRuntime('esbuild default optimizations, MathLive absent', 'base', 'esbuild-dist');
await checkRuntime('esbuild consumer with storage denied', 'base', 'esbuild-dist', true);
const minimumCherry = manifest.peerDependencies['cherry-markdown'].match(/\d+\.\d+\.\d+/)?.[0];
if (!minimumCherry) throw new Error('Unable to identify the declared minimum Cherry version.');
let published;
try {
  published = {
    status: 0,
    stdout: npm(['view', `cherry-markdown@${minimumCherry}`, 'version', '--json'], {
      cwd: fixture,
      env: childEnv,
      encoding: 'utf8',
    }),
  };
} catch (error) {
  published = { status: error.status, stdout: error.stdout?.toString(), stderr: error.stderr?.toString(), error };
}
let minimumSource = `cherry-markdown@${minimumCherry}`;
let minimumLabel = `published Cherry ${minimumCherry}`;
if (published.status !== 0) {
  let registryError;
  try {
    registryError = JSON.parse(published.stdout).error;
  } catch {
    /* Report the original failure below. */
  }
  if (registryError?.code !== 'E404')
    throw new Error(`Registry lookup failed: ${published.stderr}`, { cause: published.error });
  if (cherryManifest.version !== minimumCherry)
    throw new Error(`Unpublished minimum ${minimumCherry} must match planned Cherry ${cherryManifest.version}.`);
  minimumSource = cherryTarball;
  minimumLabel = `planned minimum Cherry ${minimumCherry} (not yet published)`;
} else if (JSON.parse(published.stdout) !== minimumCherry) {
  throw new Error(`Registry did not resolve the declared minimum ${minimumCherry}.`);
}
run('npm', ['install', '--ignore-scripts', '--strict-peer-deps', '--no-audit', '--no-fund', minimumSource]);
build(`${minimumLabel}, MathLive absent`);
await checkRuntime(`${minimumLabel}, MathLive absent`, 'base');
run('npm', [
  'install',
  '--ignore-scripts',
  '--strict-peer-deps',
  '--no-audit',
  '--no-fund',
  `echarts@${manifest.peerDependencies.echarts}`,
]);
writeEntry(true);
build(`${minimumLabel}, charts enabled`);
await checkRuntime(minimumLabel);
run('npm', ['install', '--ignore-scripts', '--strict-peer-deps', '--no-audit', '--no-fund', cherryTarball]);
build('workspace Cherry, charts enabled');
await checkRuntime('workspace Cherry');
run('npm', [
  'install',
  '--ignore-scripts',
  '--strict-peer-deps',
  '--no-audit',
  '--no-fund',
  `mermaid@${manifest.peerDependencies.mermaid}`,
  `mathlive@${manifest.peerDependencies.mathlive}`,
]);
writeEntry(false, true);
build('workspace Cherry, Mermaid and MathLive enabled');
await checkRuntime('workspace Cherry, Mermaid and MathLive enabled', 'capabilities');
verifyArtifactManifest(artifacts, `consumer-${variant}`);
console.log(`Packed consumer checks passed; fixture retained: ${fixture}`);
