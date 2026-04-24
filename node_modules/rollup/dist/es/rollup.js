/*
  @license
	Rollup.js v4.52.3
	Sat, 27 Sep 2025 07:05:38 GMT - commit 74c555c8e9ef7b62c2f57925bb2a5c0627ef8ae1

	https://github.com/rollup/rollup

	Released under the MIT License.
*/
export { version as VERSION, defineConfig, rollup, watch } from './shared/node-entry.js';
import './shared/parseAst.js';
import '../native.js';
import 'node:path';
import 'path';
import 'node:process';
import 'node:perf_hooks';
import 'node:fs/promises';
