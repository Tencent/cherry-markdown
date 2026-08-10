import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import {
  CODE_PREVIEWER_LANG_SELECT_CLASS_NAME,
  codePreviewLangSelectList,
  getCodePreviewLangSelectElement,
} from '../../src/utils/code-preview-language-setting';
import { downloadByATag } from '../../src/utils/downloadUtil';
import { getExternal } from '../../src/utils/external';
import { replaceLookbehind } from '../../src/utils/lookbehind-replace';
import { platformTransform, transformWechat } from '../../src/utils/platformTransform';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('utils/lookbehind-replace', () => {
  it('returns the input for a missing expression or no matches', () => {
    expect(replaceLookbehind('abc', null as never, vi.fn())).toBe('abc');
    expect(replaceLookbehind('abc', /z/g, vi.fn())).toBe('abc');
  });

  it('buffers global replacements without mutating regex state', () => {
    const regex = /(a)(\d)/g;
    expect(replaceLookbehind('a1-a2', regex, (_match, letter, digit) => `${letter}[${digit}]`)).toBe('a[1]-a[2]');
    expect(regex.lastIndex).toBe(0);
  });

  it('supports overlapping continuous matches', () => {
    const replacer = vi.fn((match: string) => match.toUpperCase());
    expect(replaceLookbehind('aaaa', /(a)(a)/g, replacer, true)).toBe('AAAA');
    expect(replacer).toHaveBeenCalledTimes(3);
  });
});

describe('utils/code-preview-language-setting', () => {
  it('exports a unique language list', () => {
    expect(codePreviewLangSelectList).toContain('javascript');
    expect(codePreviewLangSelectList).toContain('typescript');
    expect(new Set(codePreviewLangSelectList).size).toBe(codePreviewLangSelectList.length);
  });

  it('renders a select with only the active language selected', () => {
    const html = getCodePreviewLangSelectElement('typescript');
    const container = document.createElement('div');
    container.innerHTML = html;
    const select = container.querySelector('select');

    expect(select?.className).toBe(CODE_PREVIEWER_LANG_SELECT_CLASS_NAME);
    expect(select?.value).toBe('typescript');
    expect(container.querySelector('option[value="typescript"]')?.getAttribute('selected')).toBe('selected');
    expect(container.querySelector('option[value="javascript"]')?.hasAttribute('selected')).toBe(false);
  });
});

describe('utils/external', () => {
  it('prefers explicitly injected dependencies', () => {
    const injected = { render: vi.fn() };
    Object.assign(window, { cherryTestExternal: { global: true } });
    expect(getExternal('cherryTestExternal', injected)).toBe(injected);
  });

  it('falls back to dependencies on window', () => {
    const globalDependency = { render: vi.fn() };
    Object.assign(window, { cherryTestExternal: globalDependency });
    expect(getExternal('cherryTestExternal')).toBe(globalDependency);
  });
});

describe('utils/downloadUtil', () => {
  it('configures and activates a temporary anchor', () => {
    const anchor = document.createElement('a');
    const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => {});
    const removeSpy = vi.spyOn(anchor, 'remove').mockImplementation(() => {});
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);

    downloadByATag('blob:test', 'document.md');

    expect(anchor.href).toBe('blob:test');
    expect(anchor.download).toBe('document.md');
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(removeSpy).toHaveBeenCalledOnce();
  });
});

describe('utils/platformTransform', () => {
  it('normalizes invalid HTML inputs and rejects unsupported platforms', async () => {
    await expect(platformTransform('', 'wechat')).resolves.toBe('');
    await expect(platformTransform(null as never, 'wechat')).resolves.toBe('');
    await expect(platformTransform('<p>content</p>', 'unknown' as never)).rejects.toThrow('platform not support');
  });

  it('converts supported HTML structures for WeChat', async () => {
    const html = [
      '<figure data-lines="1"><div class="chart">chart</div></figure>',
      '<a class="link" href="https://example.com">link</a>',
      '<div style="color:red;width: 640px;height:20px;">wide</div>',
    ].join('');

    const transformed = await transformWechat(html);

    expect(transformed).toContain('<figure data-lines="1"><p class="chart">chart</p></figure>');
    expect(transformed).toContain('<a class="link" >link</a>');
    expect(transformed).toContain('width: 100%');
  });
});
