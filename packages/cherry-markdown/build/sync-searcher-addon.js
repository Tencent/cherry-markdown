/**
 * 将 plugin-searcher 样式编译并同步到 cherry-markdown/dist/addons
 * JS 由 addons.build.js 从 src/addons/cherry-searcher-plugin.js 构建，此处仅处理 CSS
 */
import * as sass from 'sass';
import { mkdirSync, existsSync, writeFileSync, copyFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const cherryRoot = resolve(currentDir, '..');
const pluginRoot = resolve(cherryRoot, '../../plugin/searcher');
const scssFile = join(pluginRoot, 'src/styles/searcher.scss');
const targetDir = join(cherryRoot, 'dist/addons');
const targetCss = join(targetDir, 'cherry-searcher-plugin.css');
const sourcePluginDts = join(cherryRoot, 'types/addons/cherry-searcher-plugin.d.ts');
const targetPluginDtsDir = join(cherryRoot, 'dist/types/addons');
const targetPluginDts = join(targetPluginDtsDir, 'cherry-searcher-plugin.d.ts');

if (!existsSync(scssFile)) {
  console.error('[sync-searcher-addon] 未找到 plugin-searcher 样式源文件，请先构建 @cherry-markdown/plugin-searcher');
  process.exit(1);
}

mkdirSync(targetDir, { recursive: true });

const cssResult = sass.compile(scssFile, {
  loadPaths: [resolve(cherryRoot, '../../node_modules')],
  style: 'expanded',
});

writeFileSync(targetCss, cssResult.css, 'utf-8');
console.log('[sync-searcher-addon] wrote %s', targetCss);

mkdirSync(targetPluginDtsDir, { recursive: true });
copyFileSync(sourcePluginDts, targetPluginDts);
console.log('[sync-searcher-addon] wrote %s', targetPluginDts);
