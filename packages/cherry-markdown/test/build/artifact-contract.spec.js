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

  it('preserves 0.11.9 bundles and pins the additive format matrix', () => {
    const publishedOutputs = [
      ['full-esm', 'index.js', 'cherry-markdown.esm.js', 'es'],
      ['full-umd', 'index.umd.js', 'cherry-markdown.js', 'umd', 'Cherry'],
      ['core-umd', 'index.core.umd.js', 'cherry-markdown.core.js', 'umd', 'Cherry'],
      ['engine-core-esm', 'index.engine.core.js', 'cherry-markdown.engine.core.esm.js', 'es'],
      ['engine-core-umd', 'index.engine.core.js', 'cherry-markdown.engine.core.js', 'umd', 'CherryEngine'],
      ['stream-esm', 'index.stream.js', 'cherry-markdown.stream.esm.js', 'es'],
      ['stream-umd', 'index.stream.umd.js', 'cherry-markdown.stream.js', 'umd', 'Cherry'],
    ];
    const additiveOutputs = [
      ['core-esm', 'index.core.js', 'cherry-markdown.core.esm.js', 'es'],
      ['engine-esm', 'index.engine.js', 'cherry-markdown.engine.esm.js', 'es'],
      ['engine-umd', 'index.engine.js', 'cherry-markdown.engine.js', 'umd', 'CherryEngine'],
    ];

    [...publishedOutputs, ...additiveOutputs].forEach(([id, entry, file, format, name]) => {
      expect(viteBuild, id).toContain(`id: '${id}'`);
      expect(viteBuild, id).toContain(`entry: resolve(src, '${entry}')`);
      expect(viteBuild, id).toContain(`file: '${file}'`);
      expect(viteBuild, id).toContain(`format: '${format}'`);
      if (name) {
        expect(viteBuild, id).toContain(`name: '${name}'`);
      }
    });
    expect(viteBuild.match(/id: '(?:full|core|engine|engine-core|stream)-(?:esm|umd)'/g)).toHaveLength(10);
    expect(viteBuild).toMatch(/id: 'full-umd'[\s\S]*?sourcemap: true/);
  });

  it('pins external dependencies and preserves sequential build outputs', () => {
    expect(viteBuild).toContain("const baseExternal = ['jsdom']");
    expect(viteBuild).toContain(
      "const coreExternal = [...baseExternal, 'mermaid', '@replit/codemirror-vim', 'codemirror', /^codemirror\\//]",
    );
    expect(viteBuild).toContain("const engineExternal = [...baseExternal, 'mermaid']");
    expect(viteBuild).toContain("const streamExternal = [...engineExternal, 'codemirror', /^codemirror\\//]");
    expect(viteBuild).toMatch(/emptyOutDir: false/);
    expect(viteBuild).toContain("minify: current.id === 'full-umd' ? false : 'terser'");
    expect(viteBuild).toContain("pure_funcs: ['console.log', 'console.info']");
    expect(readProjectFile('build/legacy-umd.plugin.js')).toMatch(/async transform/);
    expect(viteBuild).toMatch(/treeshake: false/);
    expect(viteBuild).toMatch(/codeSplitting: false/);
    expect(viteBuild).toContain("generatedCode: { preset: 'es5' }");
    expect(viteBuild).toMatch(/exports: 'named'/);
  });

  it('pins package version injection', () => {
    expect(viteBuild).toMatch(/import \{ getBuildVersion \} from '\.\/revision\.js'/);
    expect(viteBuild).toMatch(/const buildVersion = getBuildVersion\(process\.env\.NODE_ENV\)/);
    expect(viteBuild).toMatch(/'process\.env\.BUILD_VERSION': JSON\.stringify\(buildVersion\)/);
  });

  it('pins the public package entrypoints', () => {
    expect(packageJson.main).toBe('./dist/cherry-markdown.js');
    expect(packageJson.module).toBe('./dist/cherry-markdown.esm.js');
    expect(packageJson.style).toBe('./dist/cherry-markdown.min.css');
    expect(packageJson.types).toBe('./dist/types/index.d.ts');
    expect(packageJson.exports).toBeUndefined();
    expect(packageJson.files).toEqual(['dist', 'types', '!types/env.d.ts']);
  });

  it('preserves 0.11.9 declarations and pins declarations for additive bundles', () => {
    const publishedDeclarations = [
      'cherry-markdown.d.ts',
      'cherry-markdown.esm.d.ts',
      'cherry-markdown.core.d.ts',
      'cherry-markdown.engine.core.d.ts',
      'cherry-markdown.engine.core.esm.d.ts',
      'cherry-markdown.stream.d.ts',
      'cherry-markdown.stream.esm.d.ts',
    ];
    const additiveDeclarations = [
      'cherry-markdown.core.esm.d.ts',
      'cherry-markdown.engine.d.ts',
      'cherry-markdown.engine.esm.d.ts',
    ];
    const typeBuild = readProjectFile('build/replacePaths.js');

    [...publishedDeclarations, ...additiveDeclarations].forEach((file) => {
      expect(typeBuild, file).toContain(`'${file}'`);
    });
    expect(typeBuild).toContain("['cherry-markdown.d.ts', 'index'");
    expect(typeBuild).toContain("['cherry-markdown.core.d.ts', 'index.core'");
    expect(typeBuild).toContain("['cherry-markdown.stream.d.ts', 'index.stream'");
    expect(typeBuild).not.toMatch(/index\.(?:umd|core\.umd|stream\.umd)/);
  });

  it('pins the full and markdown-only stylesheet filenames and declarations', () => {
    const modules = readProjectFile('types/modules.d.ts');
    const styles = [
      'cherry-markdown.css',
      'cherry-markdown.min.css',
      'cherry-markdown.markdown.css',
      'cherry-markdown.markdown.min.css',
    ];

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

  it('pins the five font formats published in 0.11.9', () => {
    const iconfontBuild = readProjectFile('build/run-iconfont.js');

    expect(iconfontBuild).toContain("const fontName = 'ch-icon'");
    expect(iconfontBuild).toContain("const formats = ['ttf', 'woff', 'woff2', 'eot', 'svg']");
  });

  it('pins browser global and ESM side-effect boundaries', () => {
    const esmEntries = [
      'src/index.js',
      'src/index.core.js',
      'src/index.engine.js',
      'src/index.engine.core.js',
      'src/index.stream.js',
    ];
    const umdEntries = {
      'src/index.umd.js': /window\.Cherry\s*=\s*Cherry/,
      'src/index.core.umd.js': /window\.Cherry\s*=\s*Cherry/,
      'src/index.stream.umd.js': /window\.Cherry\s*=\s*CherryStream/,
    };

    esmEntries.forEach((entry) => expect(readProjectFile(entry), entry).not.toMatch(/window\.Cherry/));
    Object.entries(umdEntries).forEach(([entry, assignment]) => {
      expect(readProjectFile(entry), entry).toMatch(assignment);
    });
  });

  it('forbids unsupported alternate bundle filenames', () => {
    const buildSources = `${viteBuild}\n${stylesBuild}\n${addonsBuild}\n${JSON.stringify(packageJson)}`;

    expect(buildSources).not.toMatch(/\.iife\.js/);
    expect(buildSources).not.toMatch(/cherry-markdown\.umd\.js/);
    expect(buildSources).not.toMatch(/cherry-markdown\.min\.js/);
  });
});
