import { createRequire } from 'node:module';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);

describe('legacy forwarding behavior', () => {
  it('keeps the pure-engine UMD renderer equivalent to the new Engine CJS package', () => {
    const context = {
      console,
      document,
      DOMParser,
      Element,
      Node,
      NodeFilter,
      Document,
      DocumentFragment,
      HTMLTemplateElement,
      HTMLFormElement,
      SVGElement,
      HTMLElement,
      CustomEvent,
      Event,
      MutationObserver,
      getComputedStyle,
      localStorage,
      navigator,
      Buffer,
      process,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
    };
    context.window = context;
    context.self = context;
    vm.runInNewContext(readFileSync(resolve(projectRoot, 'dist/cherry-markdown.engine.core.js'), 'utf8'), context);
    const legacyModule = context.CherryEngine;
    const engineModule = require(resolve(projectRoot, '../engine/dist/cherry-markdown-engine.cjs'));
    const LegacyEngine = legacyModule.default || legacyModule.CherryEngine || legacyModule;
    const NewEngine = engineModule.default || engineModule.CherryEngine || engineModule;
    const markdown = '# Compatibility\n\n**same renderer**\n\n| A | B |\n| --- | --- |\n| 1 | 2 |';

    expect(new LegacyEngine().makeHtml(markdown)).toBe(new NewEngine().makeHtml(markdown));
  });
});
