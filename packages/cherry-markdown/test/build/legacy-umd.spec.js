// @vitest-environment node
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vite-plus/test';
import { legacyUmdPlugin } from '../../build/legacy-umd.plugin.js';

describe('UMD minification isolation', () => {
  it('contains hoisted wrapper variables while preserving the browser global receiver', async () => {
    // This is the wrapper shape Terser produced for the engine bundles.
    const chunk = {
      type: 'chunk',
      fileName: 'engine.js',
      code: 'var e,t;e=this,t=function(exports){exports.value=1;};t(e.Widget={});',
    };
    const context = { e: { application: true }, t: { application: true } };
    const { e, t } = context;
    await legacyUmdPlugin().generateBundle.handler({ format: 'umd' }, { 'engine.js': chunk });
    runInNewContext(chunk.code, context);
    expect(context.e).toBe(e);
    expect(context.t).toBe(t);
    expect(context.Widget.value).toBe(1);
  });
});
