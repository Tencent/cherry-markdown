import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('stylesheet ownership', () => {
  it('keeps every adapter rule scoped to the Milkdown preview instance', () => {
    const stylesheet = readFileSync(resolve(process.cwd(), 'styles.css'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*@import[^;]+;\s*$/gm, '');
    const unscoped: string[] = [];

    for (const match of stylesheet.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
      const selectorList = match[1].trim();
      if (!selectorList || selectorList.startsWith('@')) continue;
      for (const selector of selectorList.split(',')) {
        const normalized = selector.trim();
        if (normalized && !normalized.includes('.cherry-milkdown')) unscoped.push(normalized);
      }
    }

    expect(unscoped).toEqual([]);
  });
});
