// @vitest-environment node
import { afterEach, expect, it } from 'vite-plus/test';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import getReleasePlan from '@changesets/get-release-plan';
import applyReleasePlan from '@changesets/apply-release-plan';
import { getPackages } from '@manypkg/get-packages';
import { read as readConfig } from '@changesets/config';
import { CherrySemanticParser, SEMANTIC_SCHEMA_VERSION, cherryThemes } from 'cherry-markdown/semantic';
import { collectSemanticThemes } from '../../build/semantic-theme.js';

const fixtures = [];
afterEach(() => fixtures.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));
it('exposes the same schema from ESM and CommonJS without browser globals', () => {
  expect(typeof globalThis.window).toBe('undefined');
  const common = createRequire(import.meta.url)('cherry-markdown/semantic');
  const esm = new CherrySemanticParser();
  expect(common.SEMANTIC_SCHEMA_VERSION).toBe(SEMANTIC_SCHEMA_VERSION);
  expect(common.CherrySemanticParser && new common.CherrySemanticParser().parse('**shared**').blocks).toEqual(
    esm.parse('**shared**').blocks,
  );
  const doc = esm.parse('# Title\n\none\n\ntwo\n\ntail');
  doc.blocks.length = 0;
  expect(esm.parse('# Title\n\none\n\ntwo\n\ntail appended').blocks.length).toBe(4);
  expect(esm.getParseStats().mode).toBe('incremental');
});
it('derives native theme tokens from the existing Web Sass sources', () => {
  expect(cherryThemes).toEqual(collectSemanticThemes());
  expect(cherryThemes.dark['--base-previewer-bg']).not.toBe(cherryThemes.default['--base-previewer-bg']);
  expect(
    Object.values(cherryThemes).every((theme) => Object.values(theme).every((value) => !value.includes('var('))),
  ).toBe(true);
}, 30000);
it('preserves Prism aliases used by Web highlighting for native token styling', () => {
  const code = new CherrySemanticParser().parse("```js\nconsole.log('hello');\n```").blocks[0];
  expect(code.tokens.find((token) => token.text === 'console').aliases).toContain('class-name');
  expect(code.tokens.find((token) => token.text === 'log').aliases).toContain('function');
});
it.each(['patch', 'minor', 'major'])(
  'automatically releases the native adapter for a core %s and pins its new version',
  async (type) => {
    const root = mkdtempSync(resolve(tmpdir(), 'cherry-release-link-'));
    fixtures.push(root);
    const core = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
    const native = JSON.parse(readFileSync(new URL('../../../miniProgram/package.json', import.meta.url), 'utf8'));
    expect(native.dependencies['cherry-markdown']).toBe(core.version);
    mkdirSync(resolve(root, '.changeset'));
    writeFileSync(
      resolve(root, 'package.json'),
      JSON.stringify({ name: 'fixture', private: true, workspaces: ['packages/*'] }),
    );
    writeFileSync(
      resolve(root, '.changeset/config.json'),
      JSON.stringify({
        ...JSON.parse(readFileSync(new URL('../../../../.changeset/config.json', import.meta.url), 'utf8')),
        changelog: false,
      }),
    );
    for (const [name, pkg] of [
      ['core', core],
      ['native', native],
    ]) {
      mkdirSync(resolve(root, 'packages', name), { recursive: true });
      writeFileSync(
        resolve(root, 'packages', name, 'package.json'),
        JSON.stringify({
          name: pkg.name,
          version: pkg.version,
          ...(name === 'native' ? { dependencies: { 'cherry-markdown': native.dependencies['cherry-markdown'] } } : {}),
        }),
      );
    }
    writeFileSync(resolve(root, '.changeset/core.md'), `---\n'cherry-markdown': ${type}\n---\n核心修复。\n`);
    const plan = await getReleasePlan(root);
    expect(plan.releases.find((item) => item.name === native.name).type).toBe('patch');
    await applyReleasePlan(plan, await getPackages(root), await readConfig(root));
    const updatedCore = JSON.parse(readFileSync(resolve(root, 'packages/core/package.json'), 'utf8'));
    const updatedNative = JSON.parse(readFileSync(resolve(root, 'packages/native/package.json'), 'utf8'));
    expect(updatedNative.dependencies['cherry-markdown']).toBe(updatedCore.version);
    expect(updatedNative.version).not.toBe(native.version);
  },
);

it('publishes a paired native release only after a successful core release', () => {
  const workflow = readFileSync(new URL('../../../../.github/workflows/release.yml', import.meta.url), 'utf8');
  const nativeJob = workflow.slice(
    workflow.indexOf('  build-miniProgram-release:'),
    workflow.indexOf('  build-milkdown-release:'),
  );
  expect(nativeJob).toContain('needs: [release, build-core-release]');
  expect(nativeJob).toContain(
    "needs.build-core-release.result == 'success' || needs.build-core-release.result == 'skipped'",
  );
});
