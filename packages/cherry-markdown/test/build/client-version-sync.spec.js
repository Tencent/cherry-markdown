// @vitest-environment node
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = resolve(projectRoot, '../..');
const clientRoot = resolve(repoRoot, 'packages/client');

const clientPackage = JSON.parse(readFileSync(resolve(clientRoot, 'package.json'), 'utf-8'));
const tauriConf = JSON.parse(readFileSync(resolve(clientRoot, 'src-tauri/tauri.conf.json'), 'utf-8'));
const cargoToml = readFileSync(resolve(clientRoot, 'src-tauri/Cargo.toml'), 'utf-8');

function cargoVersion(toml) {
  const match = toml.match(/^version\s*=\s*"([^"]*)"/m);
  return match ? match[1] : undefined;
}

describe('packages/client version sync', () => {
  it('keeps tauri.conf.json and Cargo.toml on the package.json version', () => {
    expect(cargoVersion(cargoToml)).toBe(clientPackage.version);
    expect(tauriConf.version).toBe(clientPackage.version);
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
