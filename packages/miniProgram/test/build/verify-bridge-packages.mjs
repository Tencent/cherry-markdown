import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, symlinkSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const fixture = mkdtempSync(resolve(tmpdir(), 'cherry-bridge-consumer-'));
const localRequire = createRequire(resolve(repo, 'package.json'));
function dependencyRoot(name, pkg) {
  let directory = dirname(localRequire.resolve(name, { paths: [pkg, repo] }));
  while (directory !== dirname(directory)) {
    const file = resolve(directory, 'package.json');
    if (existsSync(file) && JSON.parse(readFileSync(file, 'utf8')).name === name) return directory;
    directory = dirname(directory);
  }
  throw new Error(`Cannot locate declared dependency: ${name}`);
}
try {
  const manifests = [];
  for (const directory of ['packages/cherry-markdown', 'packages/miniProgram']) {
    const source = resolve(repo, directory);
    const manifest = JSON.parse(readFileSync(resolve(source, 'package.json'), 'utf8'));
    manifests.push([source, manifest]);
    const [{ filename }] = JSON.parse(
      execFileSync(
        'npm',
        [
          '--cache',
          resolve(fixture, 'cache'),
          'pack',
          source,
          '--json',
          '--ignore-scripts',
          '--pack-destination',
          fixture,
        ],
        { encoding: 'utf8' },
      ),
    );
    const target = resolve(fixture, 'node_modules', manifest.name);
    mkdirSync(target, { recursive: true });
    execFileSync('tar', ['-xzf', resolve(fixture, filename), '--strip-components=1', '-C', target]);
  }
  for (const [source, manifest] of manifests)
    for (const name of Object.keys(manifest.dependencies || {})) {
      const target = resolve(fixture, 'node_modules', name);
      if (existsSync(target)) continue;
      mkdirSync(dirname(target), { recursive: true });
      symlinkSync(dependencyRoot(name, source), target, 'dir');
    }
  const consumer = resolve(fixture, 'consumer.ts');
  writeFileSync(
    consumer,
    `import { CherrySemanticParser, SemanticBridge, SemanticBlock, SEMANTIC_CORE_VERSION } from 'cherry-markdown/semantic';
import { cherryThemes } from 'cherry-markdown/theme';
import Native from '@cherry-markdown/miniprogram';
const bridge: SemanticBridge = new CherrySemanticParser();
const blocks: SemanticBlock[] = bridge.parse('**shared**').blocks;
const native = new Native({ bridge }); native.makeView('**shared**');
cherryThemes.dark['--md-heading-color']; SEMANTIC_CORE_VERSION; blocks.length;
`,
  );
  const program = ts.createProgram([consumer], {
    strict: true,
    noEmit: true,
    skipLibCheck: false,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    types: [],
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(
    diagnostics.length,
    0,
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCurrentDirectory: () => fixture,
      getCanonicalFileName: (path) => path,
      getNewLine: () => '\n',
    }),
  );
  const runtime = resolve(fixture, 'consumer.mjs');
  writeFileSync(
    runtime,
    `import assert from 'node:assert/strict';
import { CherrySemanticParser, SEMANTIC_CORE_VERSION } from 'cherry-markdown/semantic';
import { cherryThemes } from 'cherry-markdown/theme';
import Native from '@cherry-markdown/miniprogram';
const bridge = new CherrySemanticParser();
assert.deepEqual(new Native({ bridge }).makeBlocks('**shared**'), bridge.parse('**shared**').blocks);
assert.equal(typeof window, 'undefined'); assert.ok(cherryThemes.dark);
console.log('Packed public bridge and native adapter verified: ' + SEMANTIC_CORE_VERSION);
`,
  );
  await import(pathToFileURL(runtime).href);
  assert.equal(createRequire(runtime)('cherry-markdown/semantic').SEMANTIC_SCHEMA_VERSION, 1);
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
