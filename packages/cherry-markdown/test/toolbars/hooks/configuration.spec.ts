import { changeCodeTheme, changeTheme, getCodeThemeFromLocal } from '../../../src/utils/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChangeLocale from '../../../src/toolbars/hooks/ChangeLocale';
import CodeTheme from '../../../src/toolbars/hooks/CodeTheme';
import Theme from '../../../src/toolbars/hooks/Theme';
import { createMenuContext } from '../../helpers/menu';

vi.mock('../../../src/utils/config', () => ({
  changeCodeTheme: vi.fn(),
  changeTheme: vi.fn(),
  getCodeThemeFromLocal: vi.fn(),
}));

describe('toolbars/hooks configuration controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds the default locale list and changes to a registered locale', () => {
    const context = createMenuContext();
    const resetToolbar = vi.fn();
    const locales = { zh_CN: { wordCount: '字数' }, en_US: { wordCount: 'Words' } };
    const options: { locale: string; toolbars: { toolbar?: string[]; config: Record<string, never> } } = {
      locale: 'en_US',
      toolbars: { toolbar: ['bold'], config: {} },
    };
    Object.assign(context.cherry, { options, locales, resetToolbar });
    const locale = new ChangeLocale(context.cherry as never);

    expect(locale.name).toBe('English');
    expect(locale.getSubMenuConfig()).toHaveLength(3);
    expect(locale.onClick('', 'missing')).toBeUndefined();

    locale.onClick('', 'zh_CN');
    expect(context.$event.emit).toHaveBeenCalledWith('afterChangeLocale', 'zh_CN');
    expect(options.locale).toBe('zh_CN');
    expect(context.cherry.locale).toBe(locales.zh_CN);
    expect(resetToolbar).toHaveBeenCalledWith('toolbar', ['bold']);

    delete options.toolbars.toolbar;
    locale.onClick('', 'en_US');
    expect(resetToolbar).toHaveBeenLastCalledWith('toolbar', []);
  });

  it('uses custom locale entries and falls back to their Chinese label', () => {
    const context = createMenuContext();
    Object.assign(context.cherry, {
      options: {
        locale: 'missing',
        toolbars: {
          config: {
            changeLocale: [
              { locale: 'zh_CN', name: '简体中文' },
              { locale: 'ja_JP', name: '日本語' },
            ],
          },
        },
      },
    });
    const locale = new ChangeLocale(context.cherry as never);

    expect(locale.name).toBe('简体中文');
    expect(locale.getSubMenuConfig().map(({ name }) => name)).toEqual(['简体中文', '日本語']);
  });

  it('builds theme controls, locates the active item, and applies a theme', () => {
    const context = createMenuContext();
    const wrapperDom = document.createElement('div');
    wrapperDom.className = 'cherry theme__dark extra';
    Object.assign(context.cherry, {
      options: {
        theme: [
          { className: 'light', label: 'Light' },
          { className: 'dark', label: 'Dark' },
        ],
        themeSettings: { themeList: [] },
      },
    });
    Object.assign(context.cherry, { wrapperDom });
    const theme = new Theme(context.cherry as never);
    const panel = document.createElement('div');
    panel.innerHTML = [
      '<button class="cherry-dropdown-item"><i class="ch-icon-light"></i></button>',
      '<button class="cherry-dropdown-item"><i class="ch-icon-dark"></i></button>',
    ].join('');

    expect(theme.getSubMenuConfig()).toHaveLength(2);
    expect(theme.getActiveSubMenuIndex(panel)).toBe(1);
    expect(theme.onClick('', 'dark')).toBe('');
    expect(context.$event.emit).toHaveBeenCalledWith('changeMainTheme', 'dark');
    expect(changeTheme).toHaveBeenCalledWith(context.cherry, 'dark');
    expect(theme.updateMarkdown).toBe(false);

    wrapperDom.className = 'cherry';
    expect(theme.getActiveSubMenuIndex(panel)).toBe(-1);
  });

  it('falls back to themeSettings when no direct theme list is configured', () => {
    const context = createMenuContext();
    Object.assign(context.cherry, {
      options: { themeSettings: { themeList: [{ className: 'default', label: 'Default' }] } },
    });
    const theme = new Theme(context.cherry as never);

    expect(theme.getSubMenuConfig()[0]).toMatchObject({ iconName: 'default', name: 'Default' });
  });

  it('reports active code wrap/theme entries and ignores unknown themes', () => {
    const context = createMenuContext();
    const getCodeWrap = vi.fn(() => 'wrap');
    Object.assign(context.cherry, { getCodeWrap, nameSpace: 'test' });
    vi.mocked(getCodeThemeFromLocal).mockReturnValue('one-dark');
    const codeTheme = new CodeTheme(context.cherry as never);

    expect(codeTheme.getSubMenuConfig()).toHaveLength(13);
    expect(codeTheme.getActiveSubMenuIndex(document.createElement('div'))).toEqual([0, 4]);

    getCodeWrap.mockReturnValue('nowrap');
    vi.mocked(getCodeThemeFromLocal).mockReturnValue('custom');
    expect(codeTheme.getActiveSubMenuIndex(document.createElement('div'))).toEqual([]);
  });

  it('toggles code wrapping and applies code block themes', () => {
    const context = createMenuContext();
    const wrapperDom = document.createElement('div');
    const getCodeWrap = vi.fn(() => 'wrap');
    const setCodeWrap = vi.fn();
    Object.assign(context.cherry, { wrapperDom, getCodeWrap, setCodeWrap, nameSpace: 'test' });
    const codeTheme = new CodeTheme(context.cherry as never);

    codeTheme.onClick('', 'wrap');
    expect(wrapperDom.dataset.codeWrap).toBe('nowrap');
    expect(setCodeWrap).toHaveBeenCalledWith('nowrap');

    getCodeWrap.mockReturnValue('nowrap');
    codeTheme.onClick('', 'wrap');
    expect(wrapperDom.dataset.codeWrap).toBe('wrap');

    codeTheme.onClick('', 'okaidia');
    expect(context.$event.emit).toHaveBeenCalledWith('changeCodeBlockTheme', 'okaidia');
    expect(changeCodeTheme).toHaveBeenCalledWith(context.cherry, 'okaidia');

    expect(() => codeTheme.getSubMenuConfig()[1].onclick(new MouseEvent('click'))).not.toThrow();
  });
});
