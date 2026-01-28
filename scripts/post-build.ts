import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

const cwd = process.cwd();
const cherryDist = path.join(cwd, 'packages/cherry-markdown/dist');
const cherryVscodePlugin = path.join(cwd, 'packages/vscodePlugin/web-resources/dist');

// 1. 生成 cherry markdown addons 插件 exports 配置
console.log('[post-build] Generating addons exports...');
try {
  execSync('tsx scripts/generate-addons-exports.ts', { cwd, stdio: 'inherit' });
} catch (error) {
  console.warn('[post-build] Failed to generate addons exports:', error);
}

// 2. 复制 dist 到 vscode 插件
console.log('[post-build] Copying dist to vscode plugin...');
fs.cpSync(cherryDist, cherryVscodePlugin, { recursive: true });
console.log('[post-build] Done!');
