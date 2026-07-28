import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import BubbleFormula from '../../src/toolbars/BubbleFormula';

const customConfig = {
  first: {
    title: 'First',
    subCategory: {
      common: {
        title: 'Common',
        formulas: [
          { name: 'Operators', latex: '' },
          { name: 'Alpha', latex: '\\alpha' },
          { name: 'Beta', latex: '\\beta', img: '<b>beta image</b>', formulaClass: 'custom-formula' },
        ],
      },
      advanced: {
        title: 'Advanced',
        formulas: [{ name: 'Gamma', latex: '\\gamma' }],
      },
    },
  },
  second: {
    title: 'Second',
    subCategory: {
      symbols: {
        title: 'Symbols',
        formulas: [{ name: 'Delta', latex: '\\delta' }],
      },
    },
  },
};

function findFormula(bubble: BubbleFormula, latex: string) {
  return Array.from(bubble.dom.querySelectorAll<HTMLElement>('.cherry-formula-item')).find(
    (item) => item.dataset.formulaCode === latex,
  );
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('toolbars/BubbleFormula', () => {
  it('renders the built-in formula catalog and LaTeXLive link', () => {
    const bubble = new BubbleFormula();

    expect(bubble.dom.classList.contains('cherry-insert-formula-wrappler')).toBe(true);
    expect(bubble.dom.querySelectorAll('.cherry-formula-main-tab').length).toBeGreaterThan(1);
    expect(bubble.dom.querySelectorAll('.cherry-formula-sub-tab').length).toBeGreaterThan(1);
    expect(bubble.dom.querySelectorAll('.cherry-formula-item').length).toBeGreaterThan(20);
    expect(bubble.dom.querySelector('.cherry-insert-formula-more a')?.getAttribute('href')).toBe(
      'https://www.latexlive.com/',
    );
    expect(bubble.isHide()).toBe(true);
  });

  it('renders custom grouped formulas without the external link', () => {
    const bubble = new BubbleFormula({ templateConfig: customConfig, showLatexLive: false });

    expect(bubble.dom.querySelectorAll('.cherry-formula-main-tab')).toHaveLength(2);
    expect(bubble.dom.querySelectorAll('.cherry-formula-grid-group')).toHaveLength(3);
    expect(bubble.dom.querySelector('.cherry-insert-formula-more')).toBeNull();
    expect(findFormula(bubble, '\\alpha')?.textContent).toBe('Alpha');
    expect(bubble.dom.querySelector('.custom-formula b')?.textContent).toBe('beta image');
    expect(bubble.generateBubbleFormulaHtmlStr()).toContain('data-content-for="second"');
  });

  it('switches main and subcategory tabs through delegated clicks', () => {
    const bubble = new BubbleFormula({ templateConfig: customConfig, showLatexLive: false });
    const secondTab = bubble.dom.querySelector('[data-name="second"] span');
    secondTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(bubble.dom.querySelector('.cherry-formula-main-tab.active')?.getAttribute('data-name')).toBe('second');
    expect(bubble.dom.querySelector('.cherry-formula-content.active')?.getAttribute('data-content-for')).toBe('second');

    const firstTab = bubble.dom.querySelector('[data-name="first"]');
    firstTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const advancedTab = bubble.dom.querySelector(
      '.cherry-formula-content[data-content-for="first"] [data-name="advanced"] span',
    );
    advancedTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const firstContent = bubble.dom.querySelector('.cherry-formula-content[data-content-for="first"]');
    expect(firstContent?.querySelector('.cherry-formula-sub-tab.active')?.getAttribute('data-name')).toBe('advanced');
    expect(firstContent?.querySelector('.cherry-formula-grid.active')?.getAttribute('data-grid-for')).toBe('advanced');
  });

  it('selects a formula, invokes the current callback, and hides the menu', () => {
    const bubble = new BubbleFormula({ templateConfig: customConfig, showLatexLive: false });
    const callback = vi.fn();
    bubble.show(callback);
    const alpha = findFormula(bubble, '\\alpha');

    alpha?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(callback).toHaveBeenCalledWith('\\alpha');
    expect(bubble.isHide()).toBe(true);
  });

  it('ignores clicks outside tabs and formula items', () => {
    const bubble = new BubbleFormula({ templateConfig: customConfig, showLatexLive: false });
    const callback = vi.fn();
    bubble.show(callback);

    bubble.dom.querySelector('.cherry-formula-main-tabs')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    bubble.dom.querySelector('.cherry-formula-sub-tabs')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    bubble.dom.querySelector('.cherry-formula-grid-wrapper')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(callback).not.toHaveBeenCalled();
  });

  it('handles omitted and empty configuration branches', () => {
    const defaults = new BubbleFormula({ showLatexLive: false });
    expect(defaults.dom.querySelectorAll('.cherry-formula-main-tab').length).toBeGreaterThan(1);
    expect(() => defaults.afterClick('')).not.toThrow();

    Reflect.set(defaults, 'formulaConfig', null);
    expect(defaults.generateBubbleFormulaHtmlStr()).toContain('cherry-formula-content-wrapper');

    const emptyCategory = new BubbleFormula({
      templateConfig: { empty: { title: 'Empty' } },
      showLatexLive: false,
    });
    expect(emptyCategory.dom.querySelector('[data-content-for="empty"]')).not.toBeNull();
    expect(emptyCategory.dom.querySelector('.cherry-formula-sub-tab')).toBeNull();
  });
});
