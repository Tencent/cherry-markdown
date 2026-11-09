import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import Settings from '../../../src/toolbars/hooks/Settings';

describe('settings classic line break', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('reads a changed local preference each time', () => {
    const settings = Object.create(Settings.prototype);
    settings.engine = { $cherry: { options: { engine: { global: { classicBr: true } } } } };
    expect(settings.getClassicBr()).toBe(true);
    localStorage.setItem('cherry-classicBr', 'false');
    expect(settings.getClassicBr()).toBe(false);
  });

  it.each([
    [true, null, false],
    [false, null, true],
    [true, 'false', true],
    [false, 'true', false],
  ])('toggles the effective mode with config %s and stored value %s', (configured, stored, expected) => {
    if (stored !== null) localStorage.setItem('cherry-classicBr', stored);
    const wrapperDom = document.createElement('div');
    wrapperDom.innerHTML =
      '<div class="cherry-dropdown"><span><i class="ch-icon-normal"></i><span></span></span></div>';
    const paragraph = { classicBr: configured };
    const cherry = {
      wrapperDom,
      options: { engine: { global: { classicBr: configured } } },
      previewer: { update: vi.fn() },
      editor: { editor: {} },
      initText: vi.fn(),
    };
    const settings = Object.create(Settings.prototype);
    settings.$cherry = cherry;
    settings.engine = { $cherry: cherry, hookCenter: { hookList: { paragraph: [paragraph] } } };
    settings.locale = { classicBr: 'classic', normalBr: 'normal' };
    settings.matchShortcutKey = () => 'classicBr';

    settings.onClick('', 'classicBr');

    expect(cherry.options.engine.global.classicBr).toBe(expected);
    expect(paragraph.classicBr).toBe(expected);
    expect(localStorage.getItem('cherry-classicBr')).toBe(String(expected));
  });
});
