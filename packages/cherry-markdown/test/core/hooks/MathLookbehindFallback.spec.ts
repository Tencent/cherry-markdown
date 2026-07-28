import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hashHex } from '../../../src/utils/hash';
import InlineMath from '../../../src/core/hooks/InlineMath';
import MathBlock from '../../../src/core/hooks/MathBlock';

vi.mock('../../../src/utils/regexp', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/utils/regexp')>();
  return {
    ...actual,
    isLookbehindSupported: () => false,
  };
});

function attachEngine(hook: InlineMath | MathBlock) {
  Object.defineProperty(hook, '$engine', {
    value: {
      hash: (value: string) => hashHex(value),
      asyncRenderHandler: { add: vi.fn() },
    },
  });
}

function createCherry() {
  return {
    options: {
      engine: {
        syntax: {
          inlineMath: { selfClosing: false },
          mathBlock: { selfClosing: false },
        },
        global: { flowSessionContext: false },
      },
    },
  };
}

describe('core/hooks math lookbehind fallback', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  it('renders inline math without RegExp lookbehind support', () => {
    const hook = new InlineMath({ config: { engine: 'MathJax' }, cherry: createCherry() });
    attachEngine(hook);
    hook.engine = 'node';

    const html = hook.restoreCache(hook.makeInlineMath('prefix ~Dx+y~D suffix'));

    expect(html).toContain('prefix <span class="Cherry-InlineMath"');
    expect(html).toContain('data-formula-source="x%2By"');
  });

  it('transforms block math into inline math without lookbehind support', () => {
    const hook = new InlineMath({ config: { engine: 'MathJax' }, cherry: createCherry() });
    attachEngine(hook);
    hook.engine = 'node';

    const transformed = hook.transformBlockMathToInlineMath('prefix ~D~Dx~D~D suffix');
    const html = hook.restoreCache(hook.makeInlineMath(transformed));

    expect(html).toContain('data-formula-source="x"');
    expect(html).not.toContain('~D~D');
  });

  it('renders block math without RegExp lookbehind support', () => {
    const hook = new MathBlock({ config: { engine: 'MathJax' }, cherry: createCherry() });
    attachEngine(hook);
    hook.engine = 'node';

    const html = hook.restoreCache(hook.makeMath('prefix ~D~Dx^2~D~D suffix'));

    expect(html).toContain('prefix <div');
    expect(html).toContain('data-formula-source="x%5E2"');
  });
});
