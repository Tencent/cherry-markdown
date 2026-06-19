/**
 * 将 plugin-searcher 构建产物同步到 cherry-markdown/dist/addons
 */
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const cherryRoot = resolve(currentDir, '..');
const pluginDist = resolve(cherryRoot, '../../plugin/searcher/dist');
const targetDir = join(cherryRoot, 'dist/addons');

const files = ['cherry-searcher-plugin.js', 'cherry-searcher-plugin.esm.js'];

if (!existsSync(pluginDist)) {
  console.error('[sync-searcher-addon] plugin dist not found, run plugin-searcher build first');
  process.exit(1);
}

mkdirSync(targetDir, { recursive: true });

files.forEach((file) => {
  const source = join(pluginDist, file);
  const target = join(targetDir, file);
  if (!existsSync(source)) {
    console.error(`[sync-searcher-addon] missing ${source}`);
    process.exit(1);
  }
  copyFileSync(source, target);
  console.log('[sync-searcher-addon] copied %s', target);
});
