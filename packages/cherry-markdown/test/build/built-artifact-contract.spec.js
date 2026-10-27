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
  it.each(bundleNames)(
    'preserves Prism languages and streaming highlighting in %s',
    (file) => {
      execFileSync(
        process.execPath,
        [resolve(projectRoot, 'test/build/verify-prism-artifact.mjs'), resolve(distRoot, file)],
        {
          stdio: 'pipe',
          timeout: 30000,
        },
      );
    },
    35000,
  );

  it('publishes the complete UMD and ESM bundle matrix with declarations', () => {
    expect(glob.sync('*.js', { cwd: distRoot }).sort()).toEqual(
      [...bundleNames, 'cherry-markdown.semantic.esm.js', 'cherry-markdown.theme.esm.js'].sort(),
    );
    [...bundleNames, ...declarationNames].forEach((file) => {
      expect(existsSync(resolve(distRoot, file)), file).toBe(true);
    });
  });

  it('publishes the DOM-free public semantic and theme entrypoints', () => {
    for (const file of [
      'cherry-markdown.semantic.cjs',
      'cherry-markdown.theme.cjs',
      'types/semantic/index.d.ts',
      'types/semantic/theme.d.ts',
    ])
      expect(existsSync(resolve(distRoot, file)), file).toBe(true);
    const core = require(resolve(distRoot, 'cherry-markdown.semantic.cjs'));
    expect(core.SEMANTIC_SCHEMA_VERSION).toBe(1);
    expect(new core.CherrySemanticParser().parse('**native**').blocks).toHaveLength(1);
  });

  it('publishes every addon in both formats with its declaration', () => {
    const entries = glob.sync('**/*-plugin.js', { cwd: resolve(projectRoot, 'src/addons') });
    const bundles = entries.flatMap((entry) => [entry, entry.replace(/\.js$/, '.esm.js')]);
    expect(entries).toHaveLength(7);
    expect(glob.sync('**/*.js', { cwd: resolve(distRoot, 'addons') }).sort()).toEqual(bundles.sort());
    for (const entry of entries) {
      expect(existsSync(resolve(distRoot, 'types/addons', entry.replace(/\.js$/, '.d.ts'))), entry).toBe(true);
    }
  });

  it('publishes the full and markdown-only stylesheets with their module declarations', () => {
    const styles = [
      'cherry-markdown.css',
      'cherry-markdown.min.css',
      'cherry-markdown.markdown.css',
      'cherry-markdown.markdown.min.css',
    ];
    expect(glob.sync('*.css', { cwd: distRoot }).sort()).toEqual(styles.sort());
    const modules = readFileSync(resolve(projectRoot, 'types/modules.d.ts'), 'utf8');
    for (const file of styles) {
      expect(readDistFile(file).length, file).toBeGreaterThan(0);
      expect(modules).toContain(`declare module 'cherry-markdown/dist/${file}'`);
    }
  });

  it('publishes all five nonempty icon font formats', () => {
    const fonts = ['ch-icon.ttf', 'ch-icon.woff', 'ch-icon.woff2', 'ch-icon.eot', 'ch-icon.svg'];
    expect(glob.sync('*', { cwd: resolve(distRoot, 'fonts') }).sort()).toEqual(fonts.sort());
    for (const file of fonts) {
      expect(readFileSync(resolve(distRoot, 'fonts', file)).length, file).toBeGreaterThan(0);
    }
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
      // Exercise CDN bundles on a page with existing application globals.
      dom.window.e = { application: true };
      dom.window.t = { application: true };
      const existingE = dom.window.e;
      const existingT = dom.window.t;
      dom.window.eval(readDistFile(file));
      expect(typeof dom.window[globalName], file).toBe(expectedType);
      expect(dom.window.e, file).toBe(existingE);
      expect(dom.window.t, file).toBe(existingT);
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
