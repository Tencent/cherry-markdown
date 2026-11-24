// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = resolve(projectRoot, '../..');
const clientRoot = resolve(repoRoot, 'packages/client');

const clientPackage = JSON.parse(readFileSync(resolve(clientRoot, 'package.json'), 'utf-8'));
const tauriConf = JSON.parse(readFileSync(resolve(clientRoot, 'src-tauri/tauri.conf.json'), 'utf-8'));

describe('packages/client version sync', () => {
  it('syncs stale Tauri and Cargo versions after a package version bump', () => {
    const fixtureRoot = mkdtempSync(resolve(tmpdir(), 'cherry-client-version-'));
    const version = '0.5.4';

    try {
      mkdirSync(resolve(fixtureRoot, 'scripts'));
      mkdirSync(resolve(fixtureRoot, 'src-tauri'));
      writeFileSync(resolve(fixtureRoot, 'package.json'), JSON.stringify({ type: 'module', version }));
      writeFileSync(
        resolve(fixtureRoot, 'src-tauri/tauri.conf.json'),
        JSON.stringify({ ...tauriConf, version: '0.5.3' }),
      );
      writeFileSync(
        resolve(fixtureRoot, 'src-tauri/Cargo.toml'),
        '[package]\nname = "cherry-markdown-client"\nversion = "0.5.3"\n',
      );
      const syncScript = resolve(fixtureRoot, 'scripts/sync-version.js');
      copyFileSync(resolve(clientRoot, 'scripts/sync-version.js'), syncScript);

      execFileSync(process.execPath, [syncScript], { cwd: fixtureRoot });

      expect(JSON.parse(readFileSync(resolve(fixtureRoot, 'src-tauri/tauri.conf.json'), 'utf-8'))).toEqual({
        ...tauriConf,
        version,
      });
      expect(readFileSync(resolve(fixtureRoot, 'src-tauri/Cargo.toml'), 'utf-8')).toBe(
        '[package]\nname = "cherry-markdown-client"\nversion = "0.5.4"\n',
      );
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it('keeps exactly one entry point for the version sync', () => {
    // 只允许 version:sync 引用脚本本体，其他脚本一律通过它调用，
    // 避免同一个脚本被多处直接引用、也就无从判断实际生效位置。
    const scriptsReferencingSync = Object.entries(clientPackage.scripts)
      .filter(([, command]) => command.includes('sync-version.js'))
      .map(([name]) => name);
    expect(scriptsReferencingSync).toEqual(['version:sync']);
  });

  it('runs the version sync once, before tauri parses the config', () => {
    // Tauri parses tauri.conf.json before beforeBuildCommand runs, so the sync
    // has to finish before "tauri build" is invoked, not inside it.
    expect(clientPackage.scripts['tauri:build']).toMatch(/^npm run version:sync && tauri build$/);
    expect(clientPackage.scripts['tauri:dev']).toMatch(/^npm run version:sync && tauri dev$/);

    // beforeBuildCommand / beforeDevCommand 指向的脚本不能再同步一次，
    // 否则 tauri:build 一次调用会写两遍版本号。
    expect(tauriConf.build.beforeBuildCommand).toBe('vp run build');
    expect(tauriConf.build.beforeDevCommand).toBe('vp run dev');
    expect(clientPackage.scripts.build).not.toContain('sync-version');
    expect(clientPackage.scripts.dev).not.toContain('sync-version');
  });
});
