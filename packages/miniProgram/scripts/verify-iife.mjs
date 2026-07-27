import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Buffer } from 'node:buffer';
import vm from 'node:vm';

const packageRoot = process.cwd();
const distDir = resolve(packageRoot, 'dist');

const bundles = [
  {
    file: 'miniProgram-stream.js',
    exports: ['default', 'createMiniProgramStreamAdapter', 'createSseParser'],
  },
];

const esmFiles = ['miniProgram-stream.esm.js'];

function readBundle(file) {
  return readFileSync(resolve(distDir, file), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const file of esmFiles) {
  readBundle(file);
}

for (const bundle of bundles) {
  const code = readBundle(bundle.file);
  assert(!/(^|[;\n])\s*import\s*(?:[\w*{]|\()/.test(code), `${bundle.file} must not contain module imports`);
  assert(!/(^|[;\n])\s*export\s+/.test(code), `${bundle.file} must not contain module exports`);

  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.atob = (input) => Buffer.from(input, 'base64').toString('binary');
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: bundle.file });

  const globalValue = sandbox.CherryMiniProgram;
  assert(globalValue && typeof globalValue === 'object', `${bundle.file} must mount window.CherryMiniProgram`);
  for (const exportName of bundle.exports) {
    assert(exportName in globalValue, `${bundle.file} must expose ${exportName}`);
  }
}

console.log('[verify:iife] miniProgram stream ESM and IIFE outputs ok');
