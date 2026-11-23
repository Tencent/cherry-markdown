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

  it('runs the version sync before tauri build reads the config', () => {
    // Tauri parses tauri.conf.json before beforeBuildCommand runs, so the sync
    // has to finish before "tauri build" is invoked, not inside it.
    expect(clientPackage.scripts['tauri:build']).toMatch(/sync-version\.js[^&]*&&[^&]*tauri build/);
  });
});
