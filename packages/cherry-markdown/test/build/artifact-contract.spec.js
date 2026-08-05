import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import glob from 'glob';
import { describe, expect, it } from 'vite-plus/test';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const readProjectFile = (filePath) => readFileSync(resolve(projectRoot, filePath), 'utf-8');

describe('Cherry Markdown published artifact contract', () => {
  const viteBuild = readProjectFile('build/vite.build.js');
  const stylesBuild = readProjectFile('build/styles.build.js');
  const addonsBuild = readProjectFile('build/addons.build.js');
  const packageJson = JSON.parse(readProjectFile('package.json'));

  it('pins the full, core, engine, and stream ESM/UMD matrix', () => {
    const outputs = [
      ['full-esm', 'index.js', 'cherry-markdown.esm.js', 'es', 'Cherry'],
      ['full-umd', 'index.browser.js', 'cherry-markdown.js', 'umd', 'Cherry'],
      ['core-esm', 'index.core.js', 'cherry-markdown.core.esm.js', 'es', 'Cherry'],
      ['core-umd', 'index.core.browser.js', 'cherry-markdown.core.js', 'umd', 'Cherry'],
      ['engine-esm', 'index.engine.js', 'cherry-markdown.engine.esm.js', 'es', 'CherryEngine'],
      ['engine-umd', 'index.engine.browser.js', 'cherry-markdown.engine.js', 'umd', 'CherryEngine'],
      ['stream-esm', 'index.stream.js', 'cherry-markdown.stream.esm.js', 'es', 'Cherry'],
      ['stream-umd', 'index.stream.browser.js', 'cherry-markdown.stream.js', 'umd', 'Cherry'],
    ];

    outputs.forEach(([id, entry, file, format, name]) => {
      expect(viteBuild, id).toContain(`id: '${id}'`);
      expect(viteBuild, id).toContain(`entry: resolve(src, '${entry}')`);
      expect(viteBuild, id).toContain(`file: '${file}'`);
      expect(viteBuild, id).toContain(`format: '${format}'`);
      expect(viteBuild, id).toContain(`name: '${name}'`);
    });
    expect(viteBuild.match(/id: '(?:full|core|engine|stream)-(?:esm|umd)'/g)).toHaveLength(8);
  });

  it('pins external dependencies and single-file output options', () => {
    expect(viteBuild).toContain("const baseExternal = ['jsdom']");
    expect(viteBuild).toContain(
      "const coreExternal = [...baseExternal, 'mermaid', '@replit/codemirror-vim', 'codemirror', /^codemirror\\//]",
    );
    expect(viteBuild).toContain("const engineExternal = [...baseExternal, 'mermaid']");
    expect(viteBuild).toContain(
      "const streamExternal = [...engineExternal, 'codemirror', /^codemirror\\//]",
    );
    expect(viteBuild).toMatch(/emptyOutDir: false/);
    expect(viteBuild).toMatch(/codeSplitting: false/);
    expect(viteBuild).toMatch(/manualChunks: undefined/);
    expect(viteBuild).toMatch(/exports: 'named'/);
  });

  it('pins package version injection', () => {
    expect(viteBuild).toMatch(/import '\.\/revision\.js'/);
    expect(viteBuild).toMatch(
      /'process\.env\.BUILD_VERSION': JSON\.stringify\(process\.env\.BUILD_VERSION \|\| ''\)/,
    );
  });

  it('pins the public package entrypoints', () => {
    expect(packageJson.main).toBe('./dist/cherry-markdown.js');
    expect(packageJson.module).toBe('./dist/cherry-markdown.esm.js');
    expect(packageJson.style).toBe('./dist/cherry-markdown.min.css');
    expect(packageJson.types).toBe('./dist/types/index.d.ts');
    expect(packageJson.exports).toEqual({
      '.': {
        types: './dist/types/index.d.ts',
        import: './dist/cherry-markdown.esm.js',
        default: './dist/cherry-markdown.esm.js',
      },
      './umd': './dist/cherry-markdown.js',
      './types/*': './types/*.d.ts',
      './dist/*': './dist/*',
      './package.json': './package.json',
    });
    expect(packageJson.files).toEqual(['dist', 'types', '!types/env.d.ts']);
  });

  it('pins the full and markdown-only stylesheet filenames and declarations', () => {
    const modules = readProjectFile('types/modules.d.ts');
    const styles = ['cherry-markdown.css', 'cherry-markdown.min.css', 'cherry-markdown.markdown.css', 'cherry-markdown.markdown.min.css'];

    expect(stylesBuild).toContain("['src/sass/index.scss', 'cherry-markdown']");
    expect(stylesBuild).toContain("['src/sass/markdown_pure.scss', 'cherry-markdown.markdown']");
    styles.forEach((file) => expect(modules, file).toContain(`cherry-markdown/dist/${file}`));
    expect(stylesBuild).not.toContain('cherry-previewer');
  });

  it('pins addon ESM, UMD, and declaration outputs', () => {
    const addonEntries = glob.sync('src/addons/**/*-plugin.js', { cwd: projectRoot });

    expect(addonEntries).toHaveLength(7);
    expect(addonsBuild).toMatch(/\['es', 'umd'\]/);
    expect(addonsBuild).toMatch(/format === 'es' \? '\.esm\.js' : '\.js'/);
    expect(readProjectFile('tsconfig.json')).toContain('"declarationDir": "dist/types"');
  });

  it('pins browser global and ESM side-effect boundaries', () => {
    const esmEntries = ['src/index.js', 'src/index.core.js', 'src/index.engine.js', 'src/index.stream.js'];
    const browserEntries = {
      'src/index.browser.js': /window\.Cherry\s*=\s*Cherry/,
      'src/index.core.browser.js': /window\.Cherry\s*=\s*Cherry/,
      'src/index.engine.browser.js': /window\.CherryEngine\s*=\s*CherryEngine/,
      'src/index.stream.browser.js': /window\.Cherry\s*=\s*CherryStream/,
    };

    esmEntries.forEach((entry) => expect(readProjectFile(entry), entry).not.toMatch(/window\.Cherry/));
    Object.entries(browserEntries).forEach(([entry, assignment]) => {
      expect(readProjectFile(entry), entry).toMatch(assignment);
    });
  });

  it('forbids alternate IIFE, explicit UMD, and minified JavaScript filenames', () => {
    const buildSources = `${viteBuild}\n${stylesBuild}\n${addonsBuild}\n${JSON.stringify(packageJson)}`;

    expect(buildSources).not.toMatch(/\.iife\.js/);
    expect(buildSources).not.toMatch(/cherry-markdown\.umd\.js/);
    expect(buildSources).not.toMatch(/cherry-markdown\.min\.js/);
    expect(packageJson.exports['./core']).toBeUndefined();
    expect(packageJson.exports['./stream']).toBeUndefined();
    expect(packageJson.exports['./iife']).toBeUndefined();
  });
});
