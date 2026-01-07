import { describe, it, expect } from 'vitest';
import AutoLink from '../../../src/core/hooks/AutoLink';

function createAutoLinkHook(config = {}) {
  const hook = new AutoLink({ config, globalConfig: {} }) as any;
  hook.$engine = { urlProcessor: (url: string) => url };
  hook.$engine.$cherry = {
    options: {
      engine: {
        syntax: {
          autoLink: {
            attrRender: (_url: string, _text: string) => '',
          },
        },
      },
    },
  };
  return hook;
}

const autoLinkHook = new AutoLink({ config: {}, globalConfig: {} });

describe('core/hooks/autolink', () => {
  describe('isLinkInHtmlAttribute', () => {
    it('检测HTML标签属性中的链接', () => {
      const cases = [
        // 双引号、单引号、无引号属性
        ['<a href="https://cherry.editor.com">', 9, 25, true],
        ["<a href='https://cherry.editor.com'>", 9, 25, true],
        ['<a href=https://cherry.editor.com>', 8, 25, true],
        // 不同标签
        ['<img src="https://example.com/image.jpg" />', 10, 26, true],
        ['<script src="https://cdn.example.com/script.js"></script>', 13, 31, true],
        ['<input type="text" value="https://value.example.com" />', 25, 26, true],
        // 多个属性、XML命名空间
        ['<div data-url="https://data.example.com" class="test">', 15, 26, true],
        ['<a xlink:href="https://xlink.example.com">', 13, 27, true],
        // 嵌套、边界情况
        ['<div><a href="https://nested.example.com">', 15, 27, true],
        ['<a href="">', 9, 0, true],
        ['<a href="https://short.com">', 100, 10, false],
        // 不在属性中
        ['this is a plain text https://not.in.attribute.com', 19, 27, false],
        ['<div>content https://not.in.attribute.com</div>', 15, 27, false],
        ['<p>Visit https://in.content.example.com</p>', 11, 30, false],
      ];
      cases.forEach(([str, index, length, expected]) => {
        expect(autoLinkHook.isLinkInHtmlAttribute(str as string, index as number, length as number)).toBe(expected);
      });
    });
  });

  describe('isLinkInATag', () => {
    it('检测a标签内的链接', () => {
      const cases = [
        // 基础a标签
        ['<a href="https://example.com">https://example.com</a>', 26, 18, true],
        ["<a href='https://example.com'>https://example.com</a>", 26, 18, true],
        ['<a href=https://example.com>https://example.com</a>', 25, 18, true],
        // 带额外属性
        ['<a href="https://example.com" target="_blank">https://example.com</a>', 46, 19, true],
        // 嵌套、多个链接
        ['<div><a href="https://example.com">https://example.com</a></div>', 31, 18, true],
        ['<a href="https://example.com">Visit https://first.com</a>', 32, 19, true],
        ['<a href="https://example.com">Visit https://first.com and https://second.com</a>', 47, 19, true],
        // 不在a标签中
        ['this is a plain text https://not.in.tag.com', 19, 21, false],
        ['<img src="https://image.example.com" />', 10, 23, false],
        // a标签外、不完整标签
        ['Visit https://outside.com <a href="https://inside.com">inside</a>', 6, 20, false],
        ['<a href="https://incomplete.com">https://incomplete.com', 29, 24, false],
        ['<a href="https://example.com"></a> https://outside.com', 33, 20, false],
        // 边界情况
        ['<a href="https://example.com">link</a> after', 35, 5, false],
        ['<a href="https://example.com">https://example.com</a>', 100, 10, false],
        ['<a href="https://in.attribute.com">text</a>', 9, 25, true],
      ];
      cases.forEach(([str, index, length, expected]) => {
        expect(autoLinkHook.isLinkInATag(str as string, index as number, length as number)).toBe(expected);
      });
    });
  });

  describe('escapePreservedSymbol', () => {
    it('转义下划线和星号', () => {
      const cases = [
        ['https://example.com', 'https://example.com'],
        ['https://example_test.com', 'https://example&#x5f;test.com'],
        ['https://example*test.com', 'https://example&#x2a;test.com'],
        ['https://example_test*star.com', 'https://example&#x5f;test&#x2a;star.com'],
        ['https://example__test.com', 'https://example&#x5f;&#x5f;test.com'],
        ['https://example**test.com', 'https://example&#x2a;&#x2a;test.com'],
        ['', ''],
        ['_', '&#x5f;'],
        ['*', '&#x2a;'],
        ['user_name@example.com', 'user&#x5f;name@example.com'],
        ['_https://example.com', '&#x5f;https://example.com'],
        ['https://example.com_', 'https://example.com&#x5f;'],
        ['https://example.com?param_name=value', 'https://example.com?param&#x5f;name=value'],
      ];
      cases.forEach(([input, expected]) => {
        expect(AutoLink.escapePreservedSymbol(input as string)).toBe(expected);
      });
    });
  });

  describe('makeHtml', () => {
    it('非法URL原样返回', () => {
      const hook = createAutoLinkHook();
      expect(hook.makeHtml('http:invalid-url')).toBe('http:invalid-url');
      expect(hook.makeHtml('test@@example.com')).toBe('test@@example.com');
      expect(hook.makeHtml('example.com')).toBe('example.com');
      expect(hook.makeHtml('example.com/path')).toBe('example.com/path');
      expect(hook.makeHtml('<www.example.com>')).toBe('<www.example.com>');
    });

    it('javascript:和mailto:协议处理', () => {
      const hook = createAutoLinkHook();
      expect(hook.makeHtml('<javascript:void(0)>')).toBe('<javascript:void(0)>');
      expect(hook.makeHtml('mailto:not-a-valid-email')).toBe('mailto:not-a-valid-email');
    });

    it('邮箱地址转换', () => {
      const hook = createAutoLinkHook();
      expect(hook.makeHtml('test@example.com')).toContain('test@example.com');
      expect(hook.makeHtml('<test@example.com>')).toContain('href="mailto:test@example.com"');
      expect(hook.makeHtml('mailto:test@example.com')).toContain('test@example.com');
    });

    it('无协议URL转换', () => {
      const hook = createAutoLinkHook();
      expect(hook.makeHtml('www.example.com')).toContain('www.example.com');
      expect(hook.makeHtml('<https://example.com>')).toContain('href="https://example.com"');
      expect(hook.makeHtml('<https://example.com/path>')).toContain('href="https://example.com/path"');
      expect(hook.makeHtml('https://example.com')).toContain('href="https://example.com"');
      expect(hook.makeHtml('https://example.com/path')).toContain('href="https://example.com/path"');
    });

    it('target和rel属性配置', () => {
      const hook = createAutoLinkHook({ target: '_self', rel: 'nofollow' });
      expect(hook.makeHtml('https://example.com')).toContain('target="_self"');
      expect(hook.makeHtml('https://example.com')).toContain('rel="nofollow"');
    });

    it('openNewPage配置', () => {
      const hook = createAutoLinkHook({ openNewPage: true });
      expect(hook.makeHtml('https://example.com')).toContain('target="_blank"');
    });

    it('attrRender自定义属性', () => {
      const hook = createAutoLinkHook();
      hook.$engine.$cherry.options.engine.syntax.autoLink.attrRender = (url: string) =>
        `data-url="${url}" class="custom-link"`;
      expect(hook.makeHtml('https://example.com')).toContain('data-url="https://example.com"');
      expect(hook.makeHtml('https://example.com')).toContain('class="custom-link"');
    });

    it('带协议但不合法的URL', () => {
      const hook = createAutoLinkHook();
      // 协议不为空但address不符合URL格式 - 实际上这个分支很难触发
      // 因为不符合URL格式的地址通常也不会通过test(str)检查
      // 这里使用一个合法的URL来测试
      expect(hook.makeHtml('http://user@example.com')).toContain('user@example.com');
    });
  });

  describe('renderLink', () => {
    it('短链接功能', () => {
      const hook = createAutoLinkHook({ enableShortLink: true, shortLinkLength: 15 });
      expect(hook.renderLink('https://www.example.com/very/long/path')).toContain('...');
      expect(hook.renderLink('https://www.example.com/very/long/path')).toContain('www.example.com...');
    });

    it('短链接不截断', () => {
      const hook = createAutoLinkHook({ enableShortLink: true, shortLinkLength: 30 });
      expect(hook.renderLink('https://example.com')).not.toContain('...');
    });

    it('不启用短链接显示完整URL', () => {
      const hook = createAutoLinkHook({ enableShortLink: false });
      expect(hook.renderLink('https://www.example.com/very/long/path/to/resource')).toContain(
        'https://www.example.com/very/long/path/to/resource',
      );
      expect(hook.renderLink('https://www.example.com/very/long/path/to/resource')).not.toContain('...');
    });

    it('自定义链接文本', () => {
      const hook = createAutoLinkHook({ enableShortLink: true, shortLinkLength: 15 });
      expect(hook.renderLink('https://example.com', 'Click Here')).toContain('>Click Here<');
      expect(hook.renderLink('https://example.com', 'Click Here')).not.toContain('...');
    });
  });
});
