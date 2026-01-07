import { describe, expect, it, beforeEach } from 'vitest';
import { getBlockTopAndHeightWithMargin, getHTML, createElement, loadScript, loadCSS } from '../../src/utils/dom';

describe('utils/dom', () => {
  describe('getBlockTopAndHeightWithMargin', () => {
    let element: HTMLElement;
    let prevSibling: HTMLElement;
    let nextSibling: HTMLElement;

    beforeEach(() => {
      element = document.createElement('div');
      prevSibling = document.createElement('div');
      nextSibling = document.createElement('div');

      element.style.marginTop = '10px';
      element.style.marginBottom = '20px';
      element.style.height = '100px';

      prevSibling.style.marginBottom = '15px';
      nextSibling.style.marginTop = '5px';
    });

    it('无兄弟元素时计算块位置', () => {
      const result = getBlockTopAndHeightWithMargin(element);
      expect(result).toHaveProperty('height');
      expect(result).toHaveProperty('offsetTop');
      expect(result.height).toBeGreaterThanOrEqual(0);
    });

    it('处理正margin', () => {
      const result = getBlockTopAndHeightWithMargin(element);
      expect(result.height).toBeGreaterThan(0);
    });

    it('处理负margin', () => {
      element.style.marginTop = '-10px';
      element.style.marginBottom = '-20px';
      const result = getBlockTopAndHeightWithMargin(element);
      expect(result).toHaveProperty('height');
      expect(result).toHaveProperty('offsetTop');
    });
  });

  describe('getHTML', () => {
    it('null输入返回空字符串', () => {
      const cases = [null, undefined];
      cases.forEach((input) => {
        expect(getHTML(input as any, true)).toBe('');
      });
    });

    it('非元素输入返回空字符串', () => {
      const cases = ['test', 123];
      cases.forEach((input) => {
        expect(getHTML(input as any, true)).toBe('');
      });
    });

    it('返回元素的外部HTML', () => {
      const div = document.createElement('div');
      div.id = 'test';
      const result = getHTML(div, false);
      expect(result).toContain('<div');
      expect(result).toContain('id="test"');
      expect(result).toContain('</div>');
    });

    it('deep为true时返回内部HTML', () => {
      const div = document.createElement('div');
      div.id = 'test';
      div.textContent = 'content';
      const result = getHTML(div, true);
      expect(result).toContain('<div');
      expect(result).toContain('content');
      expect(result).toContain('</div>');
    });
  });

  describe('createElement', () => {
    it('创建带class名的元素', () => {
      const element = createElement('div', 'test-class');
      expect(element.className).toBe('test-class');
    });

    it('创建不带class名的元素', () => {
      const element = createElement('div');
      expect(element.className).toBe('');
    });

    it('创建带属性的元素', () => {
      const element = createElement('div', '', { id: 'test-id', role: 'button' });
      expect(element.id).toBe('test-id');
      expect(element.getAttribute('role')).toBe('button');
    });

    it('创建带data属性的元素', () => {
      const element = createElement('div', '', { 'data-test': 'value' });
      expect(element.dataset.test).toBe('value');
    });

    it('创建不同类型的标签', () => {
      const cases = [
        ['div', 'DIV'],
        ['span', 'SPAN'],
        ['button', 'BUTTON'],
      ] as const;
      cases.forEach(([tag, expected]) => {
        expect(createElement(tag as any).tagName).toBe(expected);
      });
    });
  });

  describe('loadScript', () => {
    it('script已存在时立即resolve', async () => {
      const dataUrl = 'data:text/javascript;base64,Y29uc29sZS5sb2coImxvYWRlZCIpOw==';
      // 先创建一个同 id 的 script
      const script = document.createElement('script');
      script.id = 'test-script';
      document.head.appendChild(script);

      const promise = loadScript(dataUrl, 'test-script');
      await expect(promise).resolves.not.toThrow();
    });
  });

  describe('loadCSS', () => {
    beforeEach(() => {
      const existingLinks = document.querySelectorAll('link[href*="example.com/style.css"]');
      existingLinks.forEach((link) => link.remove());
    });

    it('添加link元素到head', () => {
      loadCSS('http://example.com/style.css', 'test-css');
      const link = document.querySelector('link[href*="example.com/style.css"]');
      expect(link).toBeTruthy();
      expect(link?.getAttribute('rel')).toBe('stylesheet');
      expect(link?.getAttribute('href')).toBe('http://example.com/style.css');
    });

    it('不添加重复的link', () => {
      loadCSS('http://example.com/style.css', 'test-css-1');
      loadCSS('http://example.com/style.css', 'test-css-2');

      const links = document.querySelectorAll('link[href*="example.com/style.css"]');
      expect(links.length).toBe(2);
    });
  });
});
