// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import glob from 'glob';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vite-plus/test';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const distRoot = resolve(projectRoot, 'dist');
const declarationRoot = resolve(distRoot, 'types');
const readDistFile = (filePath) => readFileSync(resolve(distRoot, filePath), 'utf-8');

const bundleNames = [
  'cherry-markdown.esm.js',
  'cherry-markdown.js',
  'cherry-markdown.core.esm.js',
  'cherry-markdown.core.js',
  'cherry-markdown.engine.esm.js',
  'cherry-markdown.engine.js',
  'cherry-markdown.engine.core.esm.js',
  'cherry-markdown.engine.core.js',
  'cherry-markdown.stream.esm.js',
  'cherry-markdown.stream.js',
];

const declarationNames = bundleNames.map((file) => file.replace(/\.js$/, '.d.ts'));

function resolvesDeclaration(fromFile, specifier) {
  const target = resolve(dirname(fromFile), specifier);
  const declarationTarget = target.replace(/\.js$/, '');
  return [`${declarationTarget}.d.ts`, resolve(declarationTarget, 'index.d.ts')].some((candidate) =>
    existsSync(candidate),
  );
}

describe('built Cherry Markdown artifact contract', () => {
  it('publishes the complete UMD and ESM bundle matrix with declarations', () => {
    [...bundleNames, ...declarationNames].forEach((file) => {
      expect(existsSync(resolve(distRoot, file)), file).toBe(true);
    });
  });

  it('emits consumer-resolvable declaration imports without source aliases', () => {
    const declarationFiles = glob.sync('**/*.d.ts', { cwd: distRoot, absolute: true });

    expect(declarationFiles.length).toBeGreaterThan(10);
    declarationFiles.forEach((file) => {
      const source = readFileSync(file, 'utf-8');
      expect(source, file).not.toMatch(/(?:~types|@cherry|@)\//);

      const specifiers = [...source.matchAll(/(?:from\s+|import\s*)["'](\.[^"']+)["']/g)].map((match) => match[1]);
      specifiers.forEach((specifier) => {
        expect(resolvesDeclaration(file, specifier), `${file}: ${specifier}`).toBe(true);
      });
    });
  });

  it('keeps ESM entries free of browser-global registration', () => {
    bundleNames
      .filter((file) => file.endsWith('.esm.js'))
      .forEach((file) => expect(readDistFile(file), file).not.toMatch(/window\.Cherry\s*=/));
  });

  it('isolates Babel helpers inside each UMD bundle wrapper', () => {
    bundleNames
      .filter((file) => !file.endsWith('.esm.js'))
      .forEach((file) => {
        const source = readDistFile(file);
        expect(source, file).toMatch(/^(?:!function|\(function)/);
      });
  });

  it('keeps the full CDN UMD bundle parseable as ES5', () => {
    execFileSync(process.execPath, [require.resolve('es-check'), 'es5', resolve(distRoot, 'cherry-markdown.js')], {
      stdio: 'pipe',
    });
  });

  it('loads browser UMD bundles and exposes their historical globals', () => {
    const bundles = [
      ['cherry-markdown.js', 'Cherry', 'function'],
      ['cherry-markdown.core.js', 'Cherry', 'function'],
      ['cherry-markdown.engine.js', 'CherryEngine', 'object'],
      ['cherry-markdown.engine.core.js', 'CherryEngine', 'object'],
      ['cherry-markdown.stream.js', 'Cherry', 'function'],
    ];

    bundles.forEach(([file, globalName, expectedType]) => {
      const dom = new JSDOM('', { runScripts: 'outside-only', url: 'https://localhost/' });
      dom.window.mermaid = { initialize() {}, mermaidAPI: { initialize() {} } };
      dom.window.eval(readDistFile(file));
      expect(typeof dom.window[globalName], file).toBe(expectedType);
      dom.window.close();
    });
  });

  it('publishes a chained source map for the full UMD browser bundle', () => {
    expect(readDistFile('cherry-markdown.js')).toMatch(/\/\/# sourceMappingURL=cherry-markdown\.js\.map$/);
    const sourceMap = JSON.parse(readDistFile('cherry-markdown.js.map'));

    expect(sourceMap.version).toBe(3);
    expect(sourceMap.file).toBe('cherry-markdown.js');
    expect(sourceMap.sources.length).toBeGreaterThan(0);
    expect(sourceMap.sourcesContent).toHaveLength(sourceMap.sources.length);
    expect(sourceMap.mappings.length).toBeGreaterThan(0);
  });
});
