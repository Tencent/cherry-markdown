import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
  const cherryTarball = pack(cherryRoot);
  const milkdownTarball = pack(packageRoot);
  const milkdownManifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
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
    'vite@8.2.1',
  ]);
  writeFileSync(
    join(fixtureRoot, 'index.html'),
    '<div id="editor"></div><script type="module" src="/main.js"></script>\n',
  );
  writeFileSync(
    join(fixtureRoot, 'main.js'),
    `import Cherry from 'cherry-markdown';
import { milkdown } from '@cherry-markdown/milkdown';
import 'cherry-markdown/dist/cherry-markdown.css';
import '@cherry-markdown/milkdown/styles.css';
import '@milkdown/kit/prose/view/style/prosemirror.css';

window.cherry = new Cherry({
  el: document.getElementById('editor'),
  value: '# Published package consumer',
  extensions: [milkdown()],
});
`,
  );
  run(resolve(fixtureRoot, 'node_modules/.bin/vite'), ['build']);
  console.log(`Published-package consumer build passed: ${fixtureRoot}`);
  rmSync(fixtureRoot, { recursive: true, force: true });
} catch (error) {
  console.error(`Published-package consumer fixture preserved for inspection: ${fixtureRoot}`);
  throw error;
}
