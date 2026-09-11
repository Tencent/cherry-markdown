import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = mkdtempSync(join(tmpdir(), 'cherry-milkdown-consumer-'));
const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
function run(command, args) {
  execFileSync(command, args, { cwd: fixture, stdio: 'inherit' });
}
const packed = JSON.parse(
  execFileSync('npm', ['pack', packageRoot, '--json', '--pack-destination', fixture], {
    cwd: fixture,
    encoding: 'utf8',
  }),
);
writeFileSync(join(fixture, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
// Install an actually released Cherry. Never repack or rename the workspace
// Cherry version: that would hide accidental dependencies on PR-only APIs.
run('npm', [
  'install',
  '--ignore-scripts',
  '--no-audit',
  '--no-fund',
  join(fixture, packed[0].filename),
  'cherry-markdown@0.11.10',
  ...Object.entries(manifest.peerDependencies)
    .filter(([name]) => name !== 'cherry-markdown')
    .map(([name, version]) => name + '@' + version),
  'react@18.3.1',
  'react-dom@18.3.1',
  'vite@8.2.1',
]);
writeFileSync(join(fixture, 'index.html'), '<div id="root"></div><script type="module" src="/main.jsx"></script>');
writeFileSync(
  join(fixture, 'main.jsx'),
  `
import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { cherryMilkdown } from '@cherry-markdown/milkdown';
import '@cherry-markdown/milkdown/style.css';
function App() {
  const el = useRef(null);
  useEffect(() => {
    let cancelled = false;
    let instance;
    cherryMilkdown({ el: el.current, value: '# Published package' }).then(async editor => {
      if (cancelled) await editor.destroy();
      else instance = editor;
    });
    return () => { cancelled = true; void instance?.destroy(); };
  }, []);
  return <div ref={el} />;
}
createRoot(document.getElementById('root')).render(<App />);
`,
);
run(join(fixture, 'node_modules/.bin/vite'), ['build']);
console.log('Released Cherry consumer build passed; fixture retained: ' + fixture);
