import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cherryRoot = resolve(packageRoot, '../cherry-markdown');
const fixture = mkdtempSync(join(tmpdir(), 'cherry-milkdown-consumer-'));
console.log(`Consumer fixture: ${fixture}`);
const childEnv = { ...process.env, npm_config_cache: join(fixture, '.npm-cache') };
const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
function run(command, args) {
  execFileSync(command, args, { cwd: fixture, env: childEnv, stdio: 'inherit' });
}
const packed = JSON.parse(
  execFileSync('npm', ['pack', packageRoot, '--json', '--pack-destination', fixture], {
    cwd: fixture,
    env: childEnv,
    encoding: 'utf8',
  }),
);
const packedCherry = JSON.parse(
  execFileSync('npm', ['pack', cherryRoot, '--json', '--pack-destination', fixture], {
    cwd: fixture,
    env: childEnv,
    encoding: 'utf8',
  }),
);
writeFileSync(join(fixture, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
// Install both tarballs exactly as a consumer would. The Milkdown package uses
// Cherry's public engine build and does not require a Cherry editor patch.
run('npm', [
  'install',
  '--ignore-scripts',
  '--legacy-peer-deps',
  '--no-audit',
  '--no-fund',
  join(fixture, packed[0].filename),
  join(fixture, packedCherry[0].filename),
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
  '<!doctype html><meta charset="utf-8"><div id="root"></div><script type="module" src="/main.tsx"></script>',
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
function writeEntry(charts = false) {
  writeFileSync(
    join(fixture, 'main.tsx'),
    `
import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import CherryEngine from 'cherry-markdown/dist/cherry-markdown.engine.core.esm.js';
import { cherryMilkdown, type CherryMilkdownInstance } from '@cherry-markdown/milkdown';
${charts ? "import { echarts, tableChart } from '@cherry-markdown/milkdown/echarts';" : ''}
import '@cherry-markdown/milkdown/style.css';
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
        charts
          ? '# Published package\n\n| :line:{"title":"Published chart"} | Jan | Feb |\n| --- | --- | --- |\n| Sales | 1 | 2 |\n\n```echarts\n{animation:false,title:{text:"Code chart"},xAxis:{data:["Jan","Feb"]},yAxis:{},series:[{type:"line",data:[1,2]}]}\n```'
          : '# Published package',
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
  run(join(fixture, 'node_modules/.bin/tsc'), ['--noEmit']);
  run(join(fixture, 'node_modules/.bin/vite'), ['build', '--logLevel', 'warn']);
  console.log(`Consumer build passed: ${label}`);
}
async function checkChartRuntime(label) {
  const { preview } = await import(pathToFileURL(join(fixture, 'node_modules/vite/dist/node/index.js')).href);
  const server = await preview({
    root: fixture,
    configFile: false,
    preview: { host: '127.0.0.1', port: 0, strictPort: true },
  });
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const { port } = server.httpServer.address();
    await page.goto(`http://127.0.0.1:${port}/`);
    try {
      await page.locator('.ProseMirror .cherry-echarts-wrapper svg').first().waitFor();
    } catch (error) {
      throw new Error(`${label}: ${errors.join('\n')}\n${await page.locator('body').innerText()}`, { cause: error });
    }
    if (!(await page.locator('.cherry-echarts-wrapper').first().textContent()).includes('Published chart')) {
      throw new Error('Cherry table chart did not render its configured title.');
    }
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
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(`Consumer chart runtime passed: ${label}`);
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
const minimumCherry = manifest.peerDependencies['cherry-markdown'].match(/\d+\.\d+\.\d+/)?.[0];
if (!minimumCherry) throw new Error('Unable to identify the declared minimum Cherry version.');
run('npm', [
  'install',
  '--ignore-scripts',
  '--legacy-peer-deps',
  '--no-audit',
  '--no-fund',
  `cherry-markdown@${minimumCherry}`,
]);
build(`published Cherry ${minimumCherry}, MathLive absent`);
run('npm', [
  'install',
  '--ignore-scripts',
  '--legacy-peer-deps',
  '--no-audit',
  '--no-fund',
  `echarts@${manifest.peerDependencies.echarts}`,
]);
writeEntry(true);
build(`published Cherry ${minimumCherry}, charts enabled`);
await checkChartRuntime(`published Cherry ${minimumCherry}`);
run('npm', [
  'install',
  '--ignore-scripts',
  '--legacy-peer-deps',
  '--no-audit',
  '--no-fund',
  join(fixture, packedCherry[0].filename),
]);
build('workspace Cherry, charts enabled');
await checkChartRuntime('workspace Cherry');
console.log(`Packed consumer checks passed; fixture retained: ${fixture}`);
