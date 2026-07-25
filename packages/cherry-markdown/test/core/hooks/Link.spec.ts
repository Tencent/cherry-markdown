import { describe, it, expect } from 'vitest';
import Link from '../../../src/core/hooks/Link';

function createLinkHook(config = {}) {
  const hook = new Link({ config, globalConfig: {} }) as any;
  hook.$engine = { urlProcessor: (url: string) => url };
  hook.$engine.$cherry = {
    options: {
      engine: {
        syntax: {
          link: {
            attrRender: (_text: string, _url: string) => '',
          },
        },
      },
    },
  };
  return hook;
}

describe('core/hooks/link', () => {
  describe('makeHtml', () => {
    it('渲染带嵌套方括号文字的行内链接 (issue #930)', () => {
      const hook = createLinkHook();
      const input = '[[20240803][子标题]例子段落(2)](例子.md#[20240803][子标题]例子段落(2))';
      const html = hook.makeHtml(input);
      // 整个文本作为一个链接被渲染，不再原样返回
      expect(html).not.toBe(input);
      expect(html).toContain('<a href="cherry-inner://');
      // 展示文字保留内部的方括号段落
      expect(html).toContain('>[20240803][子标题]例子段落(2)</a>');
    });

    it('渲染普通行内链接', () => {
      const hook = createLinkHook();
      const html = hook.makeHtml('[text](https://example.com)');
      expect(html).toContain('<a href="cherry-inner://');
      expect(html).toContain('>text</a>');
    });

    it('保留链接文字前的前缀，如 [2][t](u) -> [2]<a>t</a>', () => {
      const hook = createLinkHook();
      const html = hook.makeHtml('[2][text](https://example.com)');
      expect(html).toContain('[2]<a href="cherry-inner://');
      expect(html).toContain('>text</a>');
    });

    it('未定义的引用式链接（无行内 url）保持原样', () => {
      const hook = createLinkHook();
      const input = '[text][undefinedref]';
      expect(hook.makeHtml(input)).toBe(input);
    });

    it('支持 {target=...} 属性', () => {
      const hook = createLinkHook();
      const html = hook.makeHtml('[text](https://example.com){target=_blank}');
      expect(html).toContain('target="_blank"');
      expect(html).toContain('>text</a>');
    });

    it('支持链接 title', () => {
      const hook = createLinkHook();
      const html = hook.makeHtml('[text](https://example.com "the title")');
      expect(html).toContain('title="the title"');
      expect(html).toContain('>text</a>');
    });

    it('支持 url 中的成对括号', () => {
      const hook = createLinkHook();
      const html = hook.makeHtml('[text](https://example.com/f(o)o)');
      expect(html).toContain('<a href="cherry-inner://');
      expect(html).toContain('>text</a>');
    });
  });
});
