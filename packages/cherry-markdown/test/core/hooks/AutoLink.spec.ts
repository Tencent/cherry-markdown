import { describe, it, expect } from 'vitest';
import AutoLink from '../../../src/core/hooks/AutoLink';

const autoLinkHook = new AutoLink({ config: {}, globalConfig: {} });

describe('core/hooks/autolink', () => {
  it('isLinkInHtmlAttribute', () => {
    const cases = [
      // 基础HTML属性测试
      {
        str: '<a href="https://cherry.editor.com">link in attribute</a>',
        index: 9,
        length: 25,
        expected: true,
      },
      {
        str: "<a href='https://cherry.editor.com'>link in attribute</a>",
        index: 9,
        length: 25,
        expected: true,
      },
      {
        str: '<a href=https://cherry.editor.com>link in attribute</a>',
        index: 8,
        length: 25,
        expected: true,
      },
      // 其他HTML标签属性测试
      {
        str: '<img src="https://example.com/image.jpg" alt="test" />',
        index: 10,
        length: 26,
        expected: true,
      },
      {
        str: '<script src="https://cdn.example.com/script.js"></script>',
        index: 13,
        length: 31,
        expected: true,
      },
      {
        str: '<link rel="stylesheet" href="https://styles.example.com/style.css" />',
        index: 33,
        length: 36,
        expected: true,
      },
      // 多个属性的情况
      {
        str: '<div data-url="https://data.example.com" class="test" id="example">content</div>',
        index: 15,
        length: 26,
        expected: true,
      },
      // 带冒号的属性名（XML命名空间）
      {
        str: '<a xlink:href="https://xlink.example.com">xlink test</a>',
        index: 13,
        length: 27,
        expected: true,
      },
      // 自闭合标签
      {
        str: '<input type="text" value="https://value.example.com" />',
        index: 25,
        length: 26,
        expected: true,
      },
      // 不带引号的属性值
      {
        str: '<div class=test data-url=https://unquoted.example.com>content</div>',
        index: 25,
        length: 29,
        expected: true,
      },
      // 嵌套标签中的链接（应该在属性中）
      {
        str: '<div><a href="https://nested.example.com">nested link</a></div>',
        index: 15,
        length: 27,
        expected: true,
      },
      // 测试不在属性中的链接（应该返回false）
      {
        str: 'this is a plain text https://not.in.attribute.com',
        index: 19,
        length: 27,
        expected: false,
      },
      {
        str: '<div>content https://not.in.attribute.com more content</div>',
        index: 15,
        length: 27,
        expected: false,
      },
      // 边界情况：链接在标签内容中
      {
        str: '<p>Visit https://in.content.example.com for more info</p>',
        index: 11,
        length: 30,
        expected: false,
      },
      // 复杂的HTML结构
      {
        str: '<ul><li><a href="https://complex.example.com/item1">Item 1</a></li></ul>',
        index: 19,
        length: 30,
        expected: true,
      },
      // 属性值中有多个URL
      {
        str: '<meta property="og:image" content="https://og.image.example.com" />',
        index: 33,
        length: 31,
        expected: true,
      },
      // 空属性值测试（无效情况）
      {
        str: '<a href="">empty link</a>',
        index: 9,
        length: 0,
        expected: true,
      },
      // 超出字符串范围的测试
      {
        str: '<a href="https://short.com">link</a>',
        index: 100,
        length: 10,
        expected: false,
      },
    ];
    cases.forEach((item) => {
      const result = autoLinkHook.isLinkInHtmlAttribute(item.str, item.index, item.length);
      expect(result).toBe(item.expected);
    });
  });

  it('isLinkInATag', () => {
    const cases = [
      // 基础a标签内的链接测试
      {
        str: '<a href="https://example.com">https://example.com</a>',
        index: 26,
        length: 18,
        expected: true,
      },
      {
        str: '<a href="https://example.com">Visit https://example.com now</a>',
        index: 33,
        length: 18,
        expected: true,
      },
      // 带属性的a标签
      {
        str: '<a href="https://example.com" target="_blank" rel="noopener">https://example.com</a>',
        index: 54,
        length: 18,
        expected: true,
      },
      // 单引号属性值
      {
        str: "<a href='https://example.com'>https://example.com</a>",
        index: 26,
        length: 18,
        expected: true,
      },
      // 无引号属性值
      {
        str: '<a href=https://example.com>https://example.com</a>',
        index: 25,
        length: 18,
        expected: true,
      },
      // 嵌套在其他标签中的a标签
      {
        str: '<div><a href="https://example.com">https://example.com</a></div>',
        index: 31,
        length: 18,
        expected: true,
      },
      // 多个a标签中的链接
      {
        str: '<a href="https://first.com">first</a> and <a href="https://second.com">https://second.com</a>',
        index: 54,
        length: 19,
        expected: true,
      },
      // a标签内容包含多个链接
      {
        str: '<a href="https://example.com">Visit https://first.com and https://second.com</a>',
        index: 32,
        length: 19,
        expected: true,
      },
      {
        str: '<a href="https://example.com">Visit https://first.com and https://second.com</a>',
        index: 47,
        length: 19,
        expected: true,
      },
      // 复杂的HTML结构
      {
        str: '<div class="container"><p><a href="https://example.com" title="link">https://example.com</a></p></div>',
        index: 62,
        length: 18,
        expected: true,
      },
      // 测试不在a标签中的链接（应该返回false）
      {
        str: 'this is a plain text https://not.in.tag.com',
        index: 19,
        length: 21,
        expected: false,
      },
      {
        str: '<div>content https://not.in.tag.com more content</div>',
        index: 15,
        length: 21,
        expected: false,
      },
      // 其他标签中的链接（不是a标签）
      {
        str: '<img src="https://image.example.com" alt="image" />',
        index: 10,
        length: 23,
        expected: false,
      },
      {
        str: '<script src="https://script.example.com"></script>',
        index: 13,
        length: 24,
        expected: false,
      },
      // a标签外的链接
      {
        str: 'Visit https://outside.com for more info <a href="https://inside.com">inside</a>',
        index: 6,
        length: 20,
        expected: false,
      },
      // 不完整的a标签
      {
        str: '<a href="https://incomplete.com">https://incomplete.com',
        index: 29,
        length: 24,
        expected: false,
      },
      {
        str: 'https://incomplete.com</a>',
        index: 0,
        length: 24,
        expected: false,
      },
      // 空a标签
      {
        str: '<a href="https://example.com"></a> https://outside.com',
        index: 33,
        length: 20,
        expected: false,
      },
      // a标签属性中的链接（在整个a标签范围内）
      {
        str: '<a href="https://in.attribute.com">text</a>',
        index: 9,
        length: 25,
        expected: true,
      },
      // 边界情况：链接刚好在a标签边界
      {
        str: '<a href="https://example.com">link</a> after',
        index: 35,
        length: 5,
        expected: false,
      },
      // 超出字符串范围的测试
      {
        str: '<a href="https://example.com">https://example.com</a>',
        index: 100,
        length: 10,
        expected: false,
      },
      // 多行内容中的链接
      {
        str: '<a href="https://example.com">\nLine 1\nhttps://example.com\nLine 2\n</a>',
        index: 32,
        length: 18,
        expected: true,
      },
      // 带特殊字符的a标签内容
      {
        str: '<a href="https://example.com">Visit (https://example.com) for info!</a>',
        index: 38,
        length: 18,
        expected: true,
      },
    ];
    cases.forEach((item) => {
      const result = autoLinkHook.isLinkInATag(item.str, item.index, item.length);
      expect(result).toBe(item.expected);
    });
  });
});
