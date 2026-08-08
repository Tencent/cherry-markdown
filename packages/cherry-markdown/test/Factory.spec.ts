import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { createMenuHook, createSyntaxHook } from '../src/Factory';
import ParagraphBase from '../src/core/ParagraphBase';
import SyntaxBase, { HOOKS_TYPE_LIST } from '../src/core/SyntaxBase';
import { createMenuContext } from './helpers/menu';

describe('Factory/createSyntaxHook', () => {
  beforeEach(() => {
    vi.stubGlobal('BUILD_ENV', 'production');
  });

  it('creates a sentence hook with filtered lifecycle overrides and config', () => {
    const beforeMakeHtml = vi.fn((markdown: string) => `before:${markdown}`);
    const makeHtml = vi.fn((markdown: string) => `<mark>${markdown}</mark>`);
    const afterMakeHtml = vi.fn((html: string) => `${html}:after`);
    const test = vi.fn((markdown: string) => markdown.startsWith('@'));
    const rule = vi.fn(() => ({ reg: /@\w+/g }));
    const HOOK_CLASS = createSyntaxHook('mention', HOOKS_TYPE_LIST.SEN, {
      beforeMakeHtml,
      makeHtml,
      afterMakeHtml,
      test,
      rule,
      ignored: () => 'ignored',
    });
    const hook = new HOOK_CLASS({ config: { enabled: true } });

    expect(hook).toBeInstanceOf(SyntaxBase);
    expect(HOOK_CLASS.HOOK_NAME).toBe('mention');
    expect(hook.config).toEqual({ enabled: true });
    expect(hook.beforeMakeHtml('@alice')).toBe('before:@alice');
    expect(hook.makeHtml('@alice')).toBe('<mark>@alice</mark>');
    expect(hook.afterMakeHtml('<mark>@alice</mark>')).toBe('<mark>@alice</mark>:after');
    expect(hook.test('@alice')).toBe(true);
    expect(hook.rule()).toEqual({ reg: /@\w+/g });
    expect(rule).toHaveBeenCalled();
  });

  it('creates a cache-aware paragraph hook and preserves custom method context', () => {
    const makeHtml = vi.fn(function (this: ParagraphBase, markdown: string) {
      return `${this.needCache}:${markdown}`;
    });
    const HOOK_CLASS = createSyntaxHook('customParagraph', HOOKS_TYPE_LIST.PAR, {
      needCache: true,
      defaultCache: { initial: 'value' },
      makeHtml,
    });
    const hook = new HOOK_CLASS({ config: { mode: 'paragraph' } });

    expect(hook).toBeInstanceOf(ParagraphBase);
    expect(Reflect.get(hook, 'needCache')).toBe(true);
    expect(hook.config).toEqual({ mode: 'paragraph' });
    expect(hook.makeHtml('body')).toBe('true:body');
    expect(makeHtml.mock.contexts[0]).toBe(hook);
  });

  it('falls back to base implementations when options are absent or invalid', () => {
    const HOOK_CLASS = createSyntaxHook('fallback', HOOKS_TYPE_LIST.SEN, {
      makeHtml: 'not a function',
      test: 123,
    });
    const hook = new HOOK_CLASS();

    expect(hook.beforeMakeHtml('source')).toBe('source');
    expect(hook.makeHtml('source')).toBe('source');
    expect(hook.afterMakeHtml('source')).toBe('source');
    expect(hook.test('source')).toBe(true);
    expect(hook.rule()).toMatchObject({ begin: '', content: '', end: '', reg: /(?:)/ });
  });
});

describe('Factory/createMenuHook', () => {
  it('creates a configured menu with object icon, shortcuts, submenu, and callbacks', () => {
    const context = createMenuContext('text');
    const afterInit = vi.fn((button: HTMLElement) => button.setAttribute('data-ready', 'true'));
    const onClick = vi.fn((selection: string) => `**${selection}**`);
    const subMenuConfig = [{ name: 'child', iconName: 'bold', onclick: vi.fn() }];
    const MENU_CLASS = createMenuHook('factoryMenu', {
      icon: {
        type: 'svg',
        content: '<svg viewBox="0 0 1 1"></svg>',
        iconStyle: 'color:red',
        iconClassName: 'factory-icon',
      },
      shortcutKeys: ['Control-B'],
      subMenuConfig,
      afterInit,
      onClick,
      ignored: 'value',
    });
    const menu = new MENU_CLASS(context.cherry as never);
    const button = menu.createBtn();

    menu.afterInit(button);
    expect(menu.name).toBe('factoryMenu');
    expect(menu.noIcon).toBe(false);
    expect(menu.shortcutKeys).toEqual(['Control-B']);
    expect(menu.getSubMenuConfig()).toBe(subMenuConfig);
    expect(button.querySelector('svg.factory-icon')?.getAttribute('style')).toBe('color:red');
    expect(button.getAttribute('data-ready')).toBe('true');
    expect(menu.onClick('text')).toBe('**text**');
    expect(onClick.mock.contexts[0]).toBe(menu);
  });

  it('filters malformed menu options and uses base callback behavior', () => {
    const context = createMenuContext();
    const MENU_CLASS = createMenuHook('filtered', {
      icon: { type: 'svg', content: 42, unknown: 'value' },
      iconName: 42,
      shortcutKeys: 'Control-X',
      subMenuConfig: {},
      onClick: 'not a function',
      afterInit: false,
    });
    const menu = new MENU_CLASS(context.cherry as never);

    expect(menu.noIcon).toBe(true);
    expect(menu.shortcutKeys).toEqual([]);
    expect(menu.getSubMenuConfig()).toEqual([]);
    expect(menu.onClick('unchanged')).toBe('unchanged');
    expect(() => menu.afterInit(document.createElement('button'))).not.toThrow();
    expect(menu.createBtn().textContent).toContain('filtered');
  });
});
