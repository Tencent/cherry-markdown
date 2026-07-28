import { describe, expect, it, vi } from 'vite-plus/test';
import Suggester from '../../../src/core/hooks/Suggester';

vi.mock('@/utils/env', () => ({
  isBrowser: () => false,
}));

vi.mock('@/utils/regexp', () => ({
  isLookbehindSupported: () => false,
}));

const configItem = {
  keyword: '@',
  suggestList: vi.fn(),
  suggestListRender: vi.fn(),
  echo: (text: string) => `<mark>${text}</mark>`,
};

const createCherry = () => ({
  locale: {},
  options: {
    editor: {
      suggester: { suggester: [configItem] },
    },
  },
  wrapperDom: document.createElement('div'),
  $event: { on: vi.fn(), off: vi.fn() },
  editor: {
    editor: { view: null },
    options: { showSuggestList: true },
  },
});

describe('core/hooks/Suggester compatibility paths', () => {
  it('skips afterInit callbacks outside a browser', () => {
    const callback = vi.fn();
    const suggester = new Suggester({ config: { suggester: [configItem] }, cherry: createCherry() });

    suggester.afterInit(callback);

    expect(callback).not.toHaveBeenCalled();
  });

  it('builds fallback rules for object configuration and missing keywords', () => {
    const objectConfig = {
      suggester: {
        mention: configItem,
        defaulted: { ...configItem, keyword: '' },
      },
    };
    const suggester = new Suggester({ config: objectConfig, cherry: createCherry() });

    expect(suggester.RULE.reg).toBeInstanceOf(RegExp);
    expect(suggester.RULE.reg.source).toContain('^|[^\\\\]');
  });
});
