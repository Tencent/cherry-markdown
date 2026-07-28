import { beforeEach, describe, expect, it, vi } from 'vitest';
import Toolbar from '../../src/toolbars/Toolbar';

vi.mock('../../src/toolbars/HookCenter', () => ({
  default: class HookCenter {},
}));

const createToolbar = () => {
  const wrapperDom = document.createElement('div');
  const toolbarDom = document.createElement('div');
  wrapperDom.appendChild(toolbarDom);
  document.body.appendChild(wrapperDom);

  const toolbar = Object.create(Toolbar.prototype);
  toolbar.options = { dom: toolbarDom };
  toolbar.$cherry = {
    wrapperDom,
    $event: {
      emit: vi.fn(),
    },
  };
  toolbar.subMenus = {};
  toolbar.currentActiveSubMenu = null;
  toolbar.menus = {
    hooks: {},
    level2MenusName: {},
  };

  return { toolbar, toolbarDom, wrapperDom };
};

describe('toolbars/Toolbar DOM behavior', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('switches the toolbar DOM between preview-only and visible states', () => {
    const { toolbar, toolbarDom } = createToolbar();

    toolbar.previewOnly();
    expect(toolbarDom.classList.contains('preview-only')).toBe(true);
    expect(toolbar.$cherry.$event.emit).toHaveBeenCalledWith('toolbarHide');

    toolbar.showToolbar();
    expect(toolbarDom.classList.contains('preview-only')).toBe(false);
    expect(toolbar.$cherry.$event.emit).toHaveBeenCalledWith('toolbarShow');
  });

  it('creates, positions, activates, and toggles a submenu', () => {
    const { toolbar, wrapperDom } = createToolbar();
    const childButton = document.createElement('button');
    childButton.className = 'cherry-dropdown-item';
    const childFire = vi.fn();

    toolbar.menus.level2MenusName.insert = ['table'];
    toolbar.menus.hooks.insert = {
      dom: document.createElement('button'),
      positionModel: 'fixed',
      getMenuPosition: () => ({ left: 20, top: 30, width: 40, height: 10 }),
      getActiveSubMenuIndex: () => 0,
    };
    toolbar.menus.hooks.table = {
      createBtn: () => childButton,
      fire: childFire,
    };

    toolbar.toggleSubMenu('insert');

    const submenu = wrapperDom.querySelector('.cherry-dropdown');
    expect(submenu).not.toBeNull();
    expect(submenu?.getAttribute('name')).toBe('insert');
    expect(submenu?.getAttribute('style')).toContain('position: fixed');
    expect(submenu?.getAttribute('style')).toContain('top: 40px');
    expect(childButton.classList.contains('cherry-dropdown-item__selected')).toBe(true);
    expect(toolbar.currentActiveSubMenu).toBe('insert');

    childButton.click();
    expect(childFire).toHaveBeenCalledOnce();
    expect(submenu?.getAttribute('style')).toContain('display: none');

    toolbar.toggleSubMenu('insert');
    expect(submenu?.getAttribute('style')).toContain('display: block');
    toolbar.toggleSubMenu('insert');
    expect(submenu?.getAttribute('style')).toContain('display: none');
    expect(toolbar.currentActiveSubMenu).toBeNull();
  });

  it('hides every submenu under the current Cherry instance', () => {
    const { toolbar, wrapperDom } = createToolbar();
    const first = document.createElement('div');
    const second = document.createElement('div');
    first.className = 'cherry-dropdown';
    second.className = 'cherry-dropdown';
    wrapperDom.append(first, second);
    toolbar.currentActiveSubMenu = 'insert';

    toolbar.hideAllSubMenu();

    expect(first.style.display).toBe('none');
    expect(second.style.display).toBe('none');
    expect(toolbar.currentActiveSubMenu).toBeNull();
  });
});
