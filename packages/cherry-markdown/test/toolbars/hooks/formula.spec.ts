import { describe, expect, it, vi } from 'vite-plus/test';
import Formula from '../../../src/toolbars/hooks/Formula';
import { createMenuContext } from '../../helpers/menu';

interface FormulaMenuLike {
  dom: HTMLElement;
  isHide(): boolean;
  show(callback: (latex: string) => void): void;
}

vi.mock('../../../src/toolbars/BubbleFormula', () => {
  class BubbleFormulaMock {
    dom = document.createElement('div');
    hidden = true;
    callback: ((latex: string) => void) | undefined;

    isHide() {
      return this.hidden;
    }

    show(callback: (latex: string) => void) {
      this.callback = callback;
      this.hidden = false;
    }
  }

  return { default: BubbleFormulaMock };
});

function createFormula(doc = 'prefix') {
  const context = createMenuContext(doc);
  const wrapperDom = document.createElement('div');
  Object.assign(context.editor, { options: { wrapperDom } });
  Object.assign(context.cherry, { options: { toolbars: { config: { formula: {} } } } });
  const formula = new Formula(context.cherry as never);
  formula.createBtn();
  return { context, formula, menu: formula.subBubbleFormulaMenu as FormulaMenuLike };
}

function selectFormula(menu: FormulaMenuLike, latex: string) {
  const callback = Reflect.get(menu, 'callback');
  if (typeof callback !== 'function') {
    throw new Error('Formula callback was not registered');
  }
  callback(latex);
}

function setRect(element: Element, left: number, top: number, width: number, height: number) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  });
}

describe('toolbars/hooks Formula', () => {
  it('inserts a single-line formula through the real MenuBase selection flow', () => {
    const { context, formula, menu } = createFormula();
    setRect(formula.dom, 10, 20, 30, 12);

    expect(formula.onClick('prefix')).toBe(false);
    selectFormula(menu, 'x^2');

    expect(context.getState().doc.toString()).toBe('prefix $ x^2 $ ');
    expect(formula.updateMarkdown).toBe(true);
  });

  it('inserts multiline LaTeX with the correct block delimiters', () => {
    const { context, formula, menu } = createFormula('prefix');
    setRect(formula.dom, 10, 20, 30, 12);

    formula.onClick('prefix');
    selectFormula(menu, 'x\ny');

    expect(context.getState().doc.toString()).toBe('prefix\n$$x\ny\n$$ ');
  });

  it('preserves an existing newline before a multiline formula', () => {
    const { context, formula, menu } = createFormula('prefix\n');
    setRect(formula.dom, 10, 20, 30, 12);

    formula.onClick('prefix\n');
    selectFormula(menu, 'x\ny');

    expect(context.getState().doc.toString()).toBe('prefix\n$$x\ny\n$$ ');
  });

  it('clamps a formula menu that would exceed the viewport', () => {
    const { formula, menu } = createFormula();
    setRect(formula.dom, 1000, 20, 50, 12);
    Object.defineProperty(menu.dom, 'offsetWidth', { value: 680 });
    Object.defineProperty(document.documentElement, 'clientWidth', { value: 500, configurable: true });

    formula.onClick('prefix');

    expect(menu.dom.style.left).toBe('0px');
    expect(menu.dom.style.top).toBe('32px');
  });

  it('returns an already cached formula when the bubble is visible', () => {
    const { formula, menu } = createFormula();
    Reflect.set(menu, 'hidden', false);
    formula.setCacheOnce('cached formula');

    expect(formula.onClick('prefix')).toBe('cached formula');
    expect(formula.hasCacheOnce()).toBe(false);
  });
});
