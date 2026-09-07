import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(packageRoot, '../..');
const cherryRoot = resolve(repositoryRoot, 'packages/cherry-markdown');
const fixtureRoot = mkdtempSync(join(tmpdir(), 'cherry-milkdown-consumer-'));
const packRoot = join(fixtureRoot, 'packages');
const npmEnvironment = { ...process.env, npm_config_cache: join(fixtureRoot, '.npm-cache') };
mkdirSync(packRoot);

function run(command, args, cwd = fixtureRoot) {
  execFileSync(command, args, { cwd, stdio: 'inherit', env: npmEnvironment });
}

function pack(directory) {
  const result = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--pack-destination', packRoot, directory], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      env: npmEnvironment,
    }),
  );
  const filename = result[0]?.filename;
  if (!filename) throw new Error(`npm pack did not return a filename for ${directory}`);
  return join(packRoot, basename(filename));
}

try {
  const milkdownManifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  const compatibleCherryVersion = milkdownManifest.peerDependencies['cherry-markdown'].match(/\d+\.\d+\.\d+/)?.[0];
  if (!compatibleCherryVersion) throw new Error('Milkdown must declare a concrete compatible Cherry peer version.');

  // Changesets applies the Cherry patch version only during release. Stage the
  // exact package contents under that target version so npm validates the
  // future published dependency tree without weakening peer resolution.
  const stagedCherryRoot = join(fixtureRoot, 'staged-cherry-markdown');
  cpSync(cherryRoot, stagedCherryRoot, {
    recursive: true,
    filter: (source) => basename(source) !== 'node_modules',
  });
  const stagedCherryManifestPath = join(stagedCherryRoot, 'package.json');
  const stagedCherryManifest = JSON.parse(readFileSync(stagedCherryManifestPath, 'utf8'));
  stagedCherryManifest.version = compatibleCherryVersion;
  writeFileSync(stagedCherryManifestPath, `${JSON.stringify(stagedCherryManifest, null, 2)}\n`);

  const cherryTarball = pack(stagedCherryRoot);
  const milkdownTarball = pack(packageRoot);
  const peers = Object.entries(milkdownManifest.peerDependencies)
    .filter(([name]) => name !== 'cherry-markdown')
    .map(([name, range]) => `${name}@${String(range).replace(/^\^/, '')}`);

  writeFileSync(
    join(fixtureRoot, 'package.json'),
    `${JSON.stringify({ name: 'cherry-milkdown-consumer', private: true, type: 'module' }, null, 2)}\n`,
  );
  run('npm', [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    cherryTarball,
    milkdownTarball,
    ...peers,
    'react@18.3.1',
    'react-dom@18.3.1',
    '@vitejs/plugin-react@6.0.5',
    'vite@8.2.1',
  ]);
  writeFileSync(
    join(fixtureRoot, 'index.html'),
    '<div id="root"></div><script type="module" src="/main.jsx"></script>\n',
  );
  writeFileSync(
    join(fixtureRoot, 'main.jsx'),
    `import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Cherry from 'cherry-markdown';
import { milkdown } from '@cherry-markdown/milkdown';
import 'cherry-markdown/dist/cherry-markdown.css';
import '@cherry-markdown/milkdown/styles.css';
import '@milkdown/kit/prose/view/style/prosemirror.css';

function App() {
  const editorRoot = useRef(null);
  useEffect(() => {
    const cherry = new Cherry({
      el: editorRoot.current,
      value: '# Published package consumer',
      extensions: [milkdown()],
    });
    window.cherry = cherry;
    return () => cherry.destroy();
  }, []);
  return <div ref={editorRoot} />;
}

createRoot(document.getElementById('root')).render(<App />);
`,
  );
  writeFileSync(
    join(fixtureRoot, 'vite.config.js'),
    `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({ plugins: [react()] });
`,
  );
  run(resolve(fixtureRoot, 'node_modules/.bin/vite'), ['build']);
  console.log(`Published-package consumer build passed: ${fixtureRoot}`);
  rmSync(fixtureRoot, { recursive: true, force: true });
} catch (error) {
  console.error(`Published-package consumer fixture preserved for inspection: ${fixtureRoot}`);
  throw error;
}
