/**
 * 校验类型文件结构与单一来源
 */
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const typesDir = join(packageRoot, 'types');
const srcDir = join(packageRoot, 'src');

const searcherTypesDts = readFileSync(join(typesDir, 'searcher.types.d.ts'), 'utf-8');
const indexDts = readFileSync(join(typesDir, 'index.d.ts'), 'utf-8');

describe('types 结构', () => {
  it('不存在 src/types.js 中转文件', () => {
    expect(existsSync(join(srcDir, 'types.js'))).toBe(false);
  });

  it('searcher.types.d.ts 为 interface 单一来源', () => {
    expect(searcherTypesDts).toContain('export interface EditorAdapter');
    expect(searcherTypesDts).toMatch(/setSearchQuery\([^)]*asRegex:\s*boolean\)/);
    expect(searcherTypesDts).not.toMatch(/declare (const|function|class)/);
  });

  it('index.d.ts 从 searcher.types 再导出，并声明运行时 API', () => {
    expect(indexDts).toContain("from './searcher.types.js'");
    expect(indexDts).toContain('export default class SearcherPanel');
    expect(indexDts).toContain('export declare function mergeOptions');
  });

  it('源码 JSDoc 直接引用 searcher.types.js', () => {
    const panelSource = readFileSync(join(srcDir, 'SearcherPanel.js'), 'utf-8');
    expect(panelSource).toContain('../types/searcher.types.js');
    expect(panelSource).not.toContain("from './types.js'");
    expect(panelSource).not.toContain("from '../types.js'");
    expect(panelSource).not.toMatch(/@import\s*\{/);
  });
});
