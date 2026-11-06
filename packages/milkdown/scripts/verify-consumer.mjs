import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';
import {
  artifactRoot,
  npm,
  workspaceRoot,
  verifyArtifactManifest,
  verifyMilkdownTarball,
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
const cherryManifest = JSON.parse(
  execFileSync('tar', ['-xOf', cherryTarball, 'package/package.json'], { encoding: 'utf8' }),
);
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
import { cherryMilkdown, type CherryMilkdownInstance } from '@cherry-markdown/milkdown';
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
declare global { interface Window { consumerEditor?: CherryMilkdownInstance; } }
function App() {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current) return;
    let disposed = false;
    let editor: CherryMilkdownInstance | undefined;
    void cherryMilkdown({
      root: el.current,
      engine: new CherryEngine({}),
      onError: (error, phase) => console.error(phase, error),
      value: ${JSON.stringify(
        (capabilities
          ? '# Capabilities\n\n```mermaid\ngraph LR\nA-->B\n```\n\n$$\nx^2\n$$'
          : charts
            ? '# Published package\n\n| :map:{"title":"Published map","mapDataSource":"consumer-map"} | Value |\n| --- | --- |\n| 北京 | 10 |\n\n| :line:{"title":"Published chart"} | Jan | Feb |\n| --- | --- | --- |\n| Sales | 1 | 2 |\n\n```echarts\n{animation:false,title:{text:"Code chart"},xAxis:{data:["Jan","Feb"]},yAxis:{},series:[{type:"line",data:[1,2]}]}\n```'
            : '# Published package') + prismFixture,
      )},
      ${charts ? 'renderers: { echarts, tableChart },' : ''}
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
createRoot(root).render(<App />);
`,
  );
}
function build(label) {
  run('npm', ['ls', '@cherry-markdown/milkdown', 'cherry-markdown', '@milkdown/kit']);
  run(process.execPath, [join(fixture, 'node_modules/typescript/bin/tsc'), '--noEmit']);
  run(process.execPath, [join(fixture, 'node_modules/vite/bin/vite.js'), 'build', '--logLevel', 'warn']);
  console.log(`Consumer build passed: ${label}`);
}
async function checkRuntime(label, mode = 'charts') {
  const { preview } = await import(pathToFileURL(join(fixture, 'node_modules/vite/dist/node/index.js')).href);
  const server = await preview({
    root: fixture,
    configFile: false,
    preview: { host: '127.0.0.1', port: 0, strictPort: true },
  });
  let browser;
  let page;
  const errors = [];
  try {
    browser = await chromium.launch();
    page = await browser.newPage();
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const { port } = server.httpServer.address();
    await page.goto(`http://127.0.0.1:${port}/`);
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
      for (const language of ['typescript', 'json', 'python'])
        await page.locator(`pre.language-${language} .token`).first().waitFor();
      await page.evaluate(() => window.consumerEditor.setMarkdown('# Base\n\nEditable'));
      await page.locator('.ProseMirror p').click();
      await page.keyboard.press('End');
      await page.keyboard.type(' typed');
      await page.waitForFunction(() => window.consumerEditor.getMarkdown().includes('Editable typed'));
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
