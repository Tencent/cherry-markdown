// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import glob from 'glob';
import { JSDOM } from 'jsdom';
import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping';
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

const nodeBundleName = 'cherry-markdown.engine.core.node.js';
const publishedBundleNames = [...bundleNames, nodeBundleName];
const declarationNames = publishedBundleNames.map((file) => file.replace(/\.js$/, '.d.ts'));
const umdFiles = [
  ...bundleNames.filter((file) => !file.endsWith('.esm.js')),
  ...glob.sync('src/addons/**/*-plugin.js', { cwd: projectRoot }).map((file) => file.replace(/^src\//, '')),
];

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

  it('preserves the ELK notice and matching source references in both full browser bundles', () => {
    const mermaidRequire = createRequire(require.resolve('mermaid'));
    const { version } = mermaidRequire('elkjs/package.json');
    const fullBundles = ['cherry-markdown.js', 'cherry-markdown.esm.js'];

    for (const file of fullBundles) {
      const source = readDistFile(file);
      expect(source, file).toContain(`elkjs ${version}`);
      expect(source, file).toContain('Copyright (c) 2017 Kiel University and others.');
      expect(source, file).toContain('Copyright (c) 2021 Kiel University and others.');
      expect(source, file).toContain('SPDX-License-Identifier: EPL-2.0 OR GPL-3.0-or-later');
      expect(source, file).toContain('https://www.eclipse.org/legal/epl-2.0/');
      expect(source, file).toContain(`https://github.com/kieler/elkjs/releases/tag/${version}`);
      expect(source, file).toContain('https://github.com/eclipse-elk/elk/releases/tag/v0.12.1');
    }
    for (const file of publishedBundleNames.filter((name) => !fullBundles.includes(name))) {
      expect(readDistFile(file), file).not.toContain('https://github.com/kieler/elkjs/releases/tag/');
    }
  });

  it('keeps bundled dependency source and license links in JS without emitting notice assets', () => {
    const assets = glob.sync('**/*', { cwd: distRoot, nodir: true });
    expect(assets.filter((file) => /THIRD_PARTY_NOTICES|cherry-bundled-dependency-licenses/.test(file))).toEqual([]);

    for (const file of ['cherry-markdown.js', 'cherry-markdown.esm.js']) {
      const code = readDistFile(file);
      expect(code, file).toContain(
        'js-yaml@4.3.2 (MIT) | Source: https://github.com/nodeca/js-yaml/tree/4.3.2 | License: https://spdx.org/licenses/MIT.html',
      );
      expect(code, file).toContain('dompurify@3.4.18');
      expect(code, file).toContain('katex@0.18.11');
    }

    const nodeNotice = readDistFile(nodeBundleName).split('Bundled third-party dependencies')[1];
    expect(nodeNotice).toContain('dompurify@3.4.18');
    expect(nodeNotice).not.toMatch(/^ \* (?:jsdom|mermaid|elkjs)@/m);
    expect(readDistFile('addons/cherry-code-block-plantuml-plugin.esm.js')).toContain('pako@');
  });

  it('publishes the complete UMD and ESM bundle matrix with declarations', () => {
    expect(glob.sync('*.js', { cwd: distRoot }).sort()).toEqual([...publishedBundleNames].sort());
    [...publishedBundleNames, ...declarationNames].forEach((file) => {
      expect(existsSync(resolve(distRoot, file)), file).toBe(true);
    });
  });

  it('renders and sanitizes Markdown in a fresh Node process', () => {
    execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        `
          import assert from 'node:assert/strict';

          assert.equal(typeof globalThis.window, 'undefined');
          assert.equal(typeof globalThis.document, 'undefined');
          const { default: CherryEngine } = await import('./dist/${nodeBundleName}');
          const engine = new CherryEngine();
          const html = engine.makeHtml('# Headless\\n\\n<p data-lines="1"><em>Cherry</em></p>');

          assert.match(html, /<h1\\b[^>]*>.*Headless.*<\\/h1>/);
          assert.match(html, /<em>Cherry<\\/em>/);
          assert.doesNotMatch(html, /data-lines=/);
          assert.equal(typeof globalThis.window, 'undefined');
          assert.equal(typeof globalThis.document, 'undefined');
        `,
      ],
      { cwd: projectRoot, stdio: 'pipe', timeout: 10000 },
    );
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
    // Check an actual token rather than only accepting a nonempty map. The
    // final Babel pass can change line positions after the asset was generated.
    const code = readDistFile('cherry-markdown.js');
    const token = 'function highlightAutomaticallyCallback';
    const index = code.indexOf(token);
    expect(index).toBeGreaterThan(0);
    const prefix = code.slice(0, index);
    const position = originalPositionFor(new TraceMap(sourceMap), {
      line: prefix.split('\n').length,
      column: prefix.length - prefix.lastIndexOf('\n') - 1,
    });
    expect(position.source).toMatch(/prismjs\/(?:components\/prism-core|prism)\.js$/);
    expect(
      sourceMap.sourcesContent[sourceMap.sources.indexOf(position.source)].split('\n')[position.line - 1],
    ).toContain(token);
  });

  describe.each(['commonjs', 'amd', 'browser-without-globalThis'])('%s loading', (mode) => {
    it.each(umdFiles)('preserves exports and application globals in %s', (file) => {
      const dom = new JSDOM('', { runScripts: 'outside-only', url: 'https://localhost/' });
      try {
        const win = dom.window;
        const mermaid = { initialize() {}, mermaidAPI: { initialize() {} } };
        win.mermaid = mermaid;
        const dependency = (id) => (id === 'mermaid' ? mermaid : require(id));
        let exported;
        if (mode === 'commonjs') {
          win.module = { exports: {} };
          win.exports = win.module.exports;
          win.require = dependency;
        } else if (mode === 'amd') {
          win.define = (ids, factory) => {
            const exports = {};
            exported = factory(...ids.map((id) => (id === 'exports' ? exports : dependency(id)))) ?? exports;
          };
          win.define.amd = {};
        } else {
          win.globalThis = undefined;
        }
        const existingE = { application: true };
        const existingT = { application: true };
        win.e = existingE;
        win.t = existingT;
        const before = new Set(Object.getOwnPropertyNames(win));
        win.eval(readDistFile(file));
        if (mode === 'commonjs') exported = win.module.exports;
        else if (mode === 'browser-without-globalThis') {
          [exported] = Object.getOwnPropertyNames(win)
            .filter((name) => !before.has(name) && name.startsWith('Cherry'))
            .map((name) => win[name]);
        }
        expect(typeof exported === 'function' || Object.keys(exported || {}).length > 0, file).toBe(true);
        expect(win.e, file).toBe(existingE);
        expect(win.t, file).toBe(existingT);
      } finally {
        dom.window.close();
      }
    });
  });
});
