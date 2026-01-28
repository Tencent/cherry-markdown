import * as path from 'path';
import * as fs from 'fs';

const cwd = process.cwd();
const cherryDist = path.join(cwd, 'packages/cherry-markdown/dist');
const cherryVscodePlugin = path.join(cwd, 'packages/vscodePlugin/web-resources/dist');

// 复制 dist 到 vscode 插件
console.log('[post-build] Copying dist to vscode plugin...');
fs.cpSync(cherryDist, cherryVscodePlugin, { recursive: true });
console.log('[post-build] Done!');
