import { beforeEach, describe, expect, it, vi } from 'vitest';
import BubbleTableMenu from '../../src/toolbars/BubbleTable';

describe('toolbars/BubbleTable', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('creates the configured table grid hidden by default', () => {
    const menu = new BubbleTableMenu({ row: 2, col: 3 });

    document.body.appendChild(menu.dom);

    expect(menu.dom.style.display).toBe('none');
    expect(menu.dom.querySelectorAll('tr')).toHaveLength(2);
    expect(menu.dom.querySelectorAll('td')).toHaveLength(6);
    expect(menu.cell[1][2].dataset).toMatchObject({ row: '2', col: '3' });
  });

  it('highlights cells up to the hovered row and column', () => {
    const menu = new BubbleTableMenu({ row: 3, col: 3 });
    document.body.appendChild(menu.dom);

    menu.cell[1][2].dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));

    expect(menu.activeRow).toBe('2');
    expect(menu.activeCol).toBe('3');
    expect(menu.dom.querySelectorAll('.active')).toHaveLength(6);

    menu.cell[0][0].dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    expect(menu.dom.querySelectorAll('.active')).toHaveLength(1);
  });

  it('returns the selected size and resets the menu after mouseup', () => {
    const menu = new BubbleTableMenu({ row: 3, col: 4 });
    const afterClick = vi.fn();
    document.body.appendChild(menu.dom);
    menu.show(afterClick);

    menu.cell[2][3].dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    menu.cell[2][3].dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    expect(afterClick).toHaveBeenCalledWith('3', '4');
    expect(menu.dom.style.display).toBe('none');
    expect(menu.dom.querySelectorAll('.active')).toHaveLength(0);
    expect(menu.activeRow).toBe(0);
    expect(menu.activeCol).toBe(0);
  });

  it('hides and resets when the editor closes toolbar submenus', () => {
    const menu = new BubbleTableMenu({ row: 2, col: 2 });
    document.body.appendChild(menu.dom);
    menu.show(vi.fn());
    menu.setActiveCell(2, 2);

    menu.dom.dispatchEvent(new Event('EditorHideToolbarSubMenu'));

    expect(menu.dom.style.display).toBe('none');
    expect(menu.dom.querySelectorAll('.active')).toHaveLength(0);
  });
});
