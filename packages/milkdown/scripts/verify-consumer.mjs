import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cherryRoot = resolve(packageRoot, '../cherry-markdown');
const fixture = mkdtempSync(join(tmpdir(), 'cherry-milkdown-consumer-'));
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
// Install both tarballs exactly as a consumer would. Milkdown now relies on the
// generic runtime-plugin lifecycle introduced by the accompanying Cherry patch.
run('npm', [
  'install',
  '--ignore-scripts',
  // The workspace tarball still reports 0.11.10 until Changesets publishes
  // both packages together; its built contents already contain the 0.11.11
  // runtime-plugin contract exercised by this fixture.
  '--legacy-peer-deps',
  '--no-audit',
  '--no-fund',
  join(fixture, packed[0].filename),
  join(fixture, packedCherry[0].filename),
  ...Object.entries(manifest.peerDependencies)
    .filter(([name]) => name !== 'cherry-markdown')
    .map(([name, version]) => name + '@' + version),
  'react@18.3.1',
  'react-dom@18.3.1',
  '@types/react@18.3.18',
  '@types/react-dom@18.3.5',
  'typescript@~5.9.3',
  'vite@8.2.1',
]);
writeFileSync(join(fixture, 'index.html'), '<div id="root"></div><script type="module" src="/main.tsx"></script>');
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
writeFileSync(
  join(fixture, 'main.tsx'),
  `
import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Cherry from 'cherry-markdown';
import { MilkdownPlugin } from '@cherry-markdown/milkdown';
import '@cherry-markdown/milkdown/style.css';
Cherry.usePlugin(MilkdownPlugin);
function App() {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current) return;
    const cherry = new Cherry({ el: el.current, value: '# Published package', isPreviewOnly: true });
    return () => cherry.destroy();
  }, []);
  return <div ref={el} />;
}
const root = document.getElementById('root');
if (!root) throw new Error('Missing React root.');
createRoot(root).render(<App />);
`,
);
run(join(fixture, 'node_modules/.bin/tsc'), ['--noEmit']);
run(join(fixture, 'node_modules/.bin/vite'), ['build']);
console.log('Released Cherry consumer build passed; fixture retained: ' + fixture);
