import { cp, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import demoConfig from '../vite.demo.config.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = resolve(packageRoot, '../..');
const output = resolve(packageRoot, 'preview');

await build(demoConfig);

await mkdir(resolve(output, 'assets'), { recursive: true });
await cp(resolve(workspaceRoot, 'examples/assets'), resolve(output, 'assets'), { recursive: true });
await mkdir(resolve(output, 'images'), { recursive: true });
await cp(resolve(workspaceRoot, 'examples/assets/images/demo-dog.png'), resolve(output, 'images/demo-dog.png'));
await cp(resolve(workspaceRoot, 'examples/assets/images/demo.mp4'), resolve(output, '视频链接地址'));
await cp(resolve(workspaceRoot, 'examples/drawio_demo.html'), resolve(output, 'drawio_demo.html'));
