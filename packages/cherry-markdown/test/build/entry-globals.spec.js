import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const readProjectFile = (filePath) => readFileSync(resolve(projectRoot, filePath), 'utf-8');

describe('browser global entry split', () => {
  it('keeps ESM entries free of window.Cherry side effects', () => {
    const esmEntries = ['src/index.js', 'src/index.core.js', 'src/index.stream.js'];

    esmEntries.forEach((entry) => {
      expect(readProjectFile(entry), entry).not.toMatch(/window\.Cherry\s*=/);
    });
  });

  it('keeps explicit globals in browser-only entries', () => {
    const browserEntries = {
      'src/index.browser.js': {
        globalAssignment: /window\.Cherry\s*=\s*Cherry/,
        namedExports: /export \* from '\.\/index'/,
      },
      'src/index.core.browser.js': {
        globalAssignment: /window\.Cherry\s*=\s*Cherry/,
        namedExports: /export \{ MenuHookBase, SyntaxHookBase \}/,
      },
      'src/index.engine.browser.js': {
        globalAssignment: /window\.CherryEngine\s*=\s*CherryEngine/,
        namedExports: /export \* from '\.\/index\.engine'/,
      },
      'src/index.stream.browser.js': {
        globalAssignment: /window\.Cherry\s*=\s*CherryStream/,
        namedExports: /export \{ SyntaxHookBase \}/,
      },
    };

    Object.entries(browserEntries).forEach(([entry, { globalAssignment, namedExports }]) => {
      const source = readProjectFile(entry);
      expect(source, entry).toMatch(/export default/);
      expect(source, entry).toMatch(globalAssignment);
      expect(source, entry).toMatch(namedExports);
    });
  });
});

describe('browser global Vite outputs', () => {
  it('builds full UMD and ESM bundles from separate entries', () => {
    const config = readProjectFile('build/vite.build.js');

    expect(config).toMatch(/index\.browser\.js/);
    expect(config).toMatch(/file: 'cherry-markdown\.js'/);
    expect(config).toMatch(/format: 'umd'/);
    expect(config).toMatch(/exports: 'named'/);
    expect(config).toMatch(/index\.js/);
    expect(config).toMatch(/cherry-markdown\.esm\.js/);
    expect(config).toMatch(/format: 'es'/);
  });

  it('preserves the UMD module and CDN contract', () => {
    const config = readProjectFile('build/vite.build.js');

    expect(config).toMatch(/format: 'umd'/);
    expect(config).not.toMatch(/format: 'iife'/);
    expect(config).toMatch(/file: 'cherry-markdown\.js'/);
  });

  it('preserves full, core, engine, and stream browser filenames', () => {
    const config = readProjectFile('build/vite.build.js');

    expect(config).toMatch(/file: 'cherry-markdown\.core\.js'/);
    expect(config).toMatch(/cherry-markdown\.core\.esm\.js/);
    expect(config).toMatch(/file: 'cherry-markdown\.engine\.js'/);
    expect(config).toMatch(/cherry-markdown\.engine\.esm\.js/);
    expect(config).toMatch(/file: 'cherry-markdown\.stream\.js'/);
    expect(config).toMatch(/cherry-markdown\.stream\.esm\.js/);
  });

  it('injects the package version into every production bundle', () => {
    const config = readProjectFile('build/vite.build.js');

    expect(config).toMatch(/import '\.\/revision\.js'/);
    expect(config).toMatch(/'process\.env\.BUILD_VERSION': JSON\.stringify\(process\.env\.BUILD_VERSION \|\| ''\)/);
  });

  it('preserves the markdown-only stylesheet filenames', () => {
    const stylesConfig = readProjectFile('build/styles.build.js');
    const modules = readProjectFile('types/modules.d.ts');

    expect(stylesConfig).toMatch(/\['src\/sass\/markdown_pure\.scss', 'cherry-markdown\.markdown'\]/);
    expect(stylesConfig).not.toMatch(/\['src\/sass\/markdown_pure\.scss', 'cherry-previewer'\]/);
    expect(modules).toContain("cherry-markdown/dist/cherry-markdown.markdown.css");
    expect(modules).toContain("cherry-markdown/dist/cherry-markdown.markdown.min.css");
  });

  it('keeps package and addon browser entries on legacy filenames', () => {
    const packageJson = JSON.parse(readProjectFile('package.json'));
    const addonConfig = readProjectFile('build/addons.build.js');

    expect(packageJson.main).toBe('./dist/cherry-markdown.js');
    expect(packageJson.exports['./umd']).toBe('./dist/cherry-markdown.js');
    expect(packageJson.exports['./iife']).toBeUndefined();
    expect(packageJson.scripts['check-bundle']).toContain('dist/cherry-markdown.js');
    expect(addonConfig).toMatch(/format === 'es' \? '\.esm\.js' : '\.js'/);
    expect(addonConfig).toMatch(/\['es', 'umd'\]/);
    expect(addonConfig).not.toMatch(/iife/);
  });
});
