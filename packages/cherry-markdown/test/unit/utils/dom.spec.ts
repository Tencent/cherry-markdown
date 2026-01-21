/**
 * dom.js 测试
 * 测试 DOM 工具函数
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getHTML, createElement, loadScript, loadCSS } from '@/utils/dom';

describe('dom.js', () => {
  describe('getHTML', () => {
    it('获取元素的外层 HTML（shallow）', () => {
      const div = document.createElement('div');
      div.className = 'test-class';
      div.id = 'test-id';

      const result = getHTML(div, false);
      expect(result).toContain('<div');
      expect(result).toContain('class="test-class"');
      expect(result).toContain('id="test-id"');
    });

    it('获取元素的完整 HTML（deep）', () => {
      const div = document.createElement('div');
      div.innerHTML = '<span>inner content</span>';

      const result = getHTML(div, true);
      expect(result).toContain('<div');
      expect(result).toContain('<span>inner content</span>');
      expect(result).toContain('</div>');
    });

    it('空元素', () => {
      const div = document.createElement('div');
      
      const shallow = getHTML(div, false);
      expect(shallow).toBe('<div></div>');

      const deep = getHTML(div, true);
      expect(deep).toBe('<div></div>');
    });

    it('带属性的元素', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.name = 'username';
      input.placeholder = 'Enter name';

      const result = getHTML(input, false);
      expect(result).toContain('type="text"');
      expect(result).toContain('name="username"');
    });

    it('null 或 undefined 返回空字符串', () => {
      expect(getHTML(null, false)).toBe('');
      expect(getHTML(undefined, false)).toBe('');
    });

    it('非元素对象返回空字符串', () => {
      expect(getHTML({}, false)).toBe('');
      expect(getHTML({ tagName: null }, false)).toBe('');
    });

    it('嵌套元素（deep=true）', () => {
      const parent = document.createElement('div');
      parent.className = 'parent';
      parent.innerHTML = '<ul><li>Item 1</li><li>Item 2</li></ul>';

      const result = getHTML(parent, true);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Item 1</li>');
      expect(result).toContain('<li>Item 2</li>');
      expect(result).toContain('</ul>');
    });

    it('自闭合标签', () => {
      const img = document.createElement('img');
      img.src = 'test.png';
      img.alt = 'test image';

      const result = getHTML(img, false);
      expect(result).toContain('<img');
      expect(result).toContain('src="test.png"');
    });
  });

  describe('createElement', () => {
    it('创建基本元素', () => {
      const div = createElement('div');
      expect(div.tagName).toBe('DIV');
      expect(div.className).toBe('');
    });

    it('创建带 className 的元素', () => {
      const div = createElement('div', 'my-class');
      expect(div.className).toBe('my-class');
    });

    it('创建带多个 class 的元素', () => {
      const div = createElement('div', 'class1 class2 class3');
      expect(div.classList.contains('class1')).toBe(true);
      expect(div.classList.contains('class2')).toBe(true);
      expect(div.classList.contains('class3')).toBe(true);
    });

    it('创建带属性的元素', () => {
      const input = createElement('input', 'form-input', {
        type: 'text',
        name: 'username',
        placeholder: 'Enter username',
      });

      expect(input.tagName).toBe('INPUT');
      expect(input.className).toBe('form-input');
      expect(input.getAttribute('type')).toBe('text');
      expect(input.getAttribute('name')).toBe('username');
      expect(input.getAttribute('placeholder')).toBe('Enter username');
    });

    it('创建带 data- 属性的元素', () => {
      const div = createElement('div', 'data-element', {
        'data-id': '123',
        'data-type': 'card',
        'data-active': 'true',
      });

      expect(div.dataset.id).toBe('123');
      expect(div.dataset.type).toBe('card');
      expect(div.dataset.active).toBe('true');
    });

    it('混合普通属性和 data- 属性', () => {
      const button = createElement('button', 'btn', {
        type: 'submit',
        disabled: 'true',
        'data-action': 'save',
      });

      expect(button.getAttribute('type')).toBe('submit');
      expect(button.getAttribute('disabled')).toBe('true');
      expect(button.dataset.action).toBe('save');
    });

    it('创建不同类型的元素', () => {
      const span = createElement('span');
      expect(span.tagName).toBe('SPAN');

      const p = createElement('p');
      expect(p.tagName).toBe('P');

      const a = createElement('a', 'link', { href: '#' });
      expect(a.tagName).toBe('A');
      expect(a.getAttribute('href')).toBe('#');
    });

    it('空属性对象', () => {
      const div = createElement('div', 'my-class', {});
      expect(div.className).toBe('my-class');
      expect(div.attributes.length).toBe(1); // 只有 class
    });
  });

  describe('loadScript', () => {
    beforeEach(() => {
      // 清理 head 中的测试脚本
      document.querySelectorAll('script[id^="test-script"]').forEach((el) => el.remove());
    });

    afterEach(() => {
      document.querySelectorAll('script[id^="test-script"]').forEach((el) => el.remove());
    });

    it('创建 script 元素', async () => {
      const promise = loadScript('https://example.com/script.js', 'test-script-1');
      
      // 模拟脚本加载完成
      const script = document.querySelector('script[src="https://example.com/script.js"]') as HTMLScriptElement;
      expect(script).toBeTruthy();
      expect(script.async).toBe(true);
      
      // 触发 onload
      if (script.onload) {
        script.onload(new Event('load'));
      }
      await promise;
    });

    it('已存在相同 ID 的脚本时直接返回', async () => {
      // 先添加一个脚本
      const existing = document.createElement('script');
      existing.id = 'test-script-existing';
      document.head.appendChild(existing);

      const promise = loadScript('https://example.com/new.js', 'test-script-existing');
      await expect(promise).resolves.toBeUndefined();

      // 应该没有新增脚本
      const scripts = document.querySelectorAll('script[src="https://example.com/new.js"]');
      expect(scripts.length).toBe(0);
    });

    it('加载失败时 reject', async () => {
      const promise = loadScript('https://example.com/fail.js', 'test-script-fail');
      
      const script = document.querySelector('script[src="https://example.com/fail.js"]') as HTMLScriptElement;
      if (script.onerror) {
        (script.onerror as any)(new Event('error'));
      }
      
      await expect(promise).rejects.toBeDefined();
    });
  });

  describe('loadCSS', () => {
    beforeEach(() => {
      document.querySelectorAll('link[id^="test-css"]').forEach((el) => el.remove());
    });

    afterEach(() => {
      document.querySelectorAll('link[id^="test-css"]').forEach((el) => el.remove());
    });

    it('创建 link 元素', () => {
      loadCSS('https://example.com/style.css', 'test-css-1');

      const link = document.querySelector('link[href="https://example.com/style.css"]') as HTMLLinkElement;
      expect(link).toBeTruthy();
      expect(link.rel).toBe('stylesheet');
      expect(link.type).toBe('text/css');
    });

    it('已存在相同 ID 的样式时不重复加载', () => {
      // 先添加一个样式
      const existing = document.createElement('link');
      existing.id = 'test-css-existing';
      document.head.appendChild(existing);

      loadCSS('https://example.com/new.css', 'test-css-existing');

      // 应该没有新增样式
      const links = document.querySelectorAll('link[href="https://example.com/new.css"]');
      expect(links.length).toBe(0);
    });

    it('不同 ID 可以加载多个样式', () => {
      loadCSS('https://example.com/style1.css', 'test-css-a');
      loadCSS('https://example.com/style2.css', 'test-css-b');

      expect(document.querySelector('link[href="https://example.com/style1.css"]')).toBeTruthy();
      expect(document.querySelector('link[href="https://example.com/style2.css"]')).toBeTruthy();
    });
  });

  describe('边界情况', () => {
    it('createElement 处理特殊字符属性值', () => {
      const div = createElement('div', '', {
        'data-json': '{"key":"value"}',
        'data-html': '<script>alert(1)</script>',
      });

      expect(div.dataset.json).toBe('{"key":"value"}');
      expect(div.dataset.html).toBe('<script>alert(1)</script>');
    });

    it('getHTML 处理带特殊字符的内容', () => {
      const div = document.createElement('div');
      div.innerHTML = '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>';

      const result = getHTML(div, true);
      expect(result).toContain('&lt;script&gt;');
    });
  });
});
