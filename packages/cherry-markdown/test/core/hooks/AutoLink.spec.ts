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

  it('escapePreservedSymbol', () => {
    const cases = [
      // 基础下划线测试
      {
        input: 'https://example.com',
        expected: 'https://example.com',
      },
      {
        input: 'https://example_test.com',
        expected: 'https://example&#x5f;test.com',
      },
      {
        input: 'https://example.com/path_with_underscore',
        expected: 'https://example.com/path&#x5f;with&#x5f;underscore',
      },
      // 基础星号测试
      {
        input: 'https://example*test.com',
        expected: 'https://example&#x2a;test.com',
      },
      {
        input: 'https://example.com/*path*',
        expected: 'https://example.com/&#x2a;path&#x2a;',
      },
      // 混合下划线和星号
      {
        input: 'https://example_test*star.com',
        expected: 'https://example&#x5f;test&#x2a;star.com',
      },
      {
        input: 'https://example.com/path_*_test',
        expected: 'https://example.com/path&#x5f;&#x2a;&#x5f;test',
      },
      // 多个连续的下划线或星号
      {
        input: 'https://example__test.com',
        expected: 'https://example&#x5f;&#x5f;test.com',
      },
      {
        input: 'https://example**test.com',
        expected: 'https://example&#x2a;&#x2a;test.com',
      },
      {
        input: 'https://example.com/path___test',
        expected: 'https://example.com/path&#x5f;&#x5f;&#x5f;test',
      },
      // 空字符串
      {
        input: '',
        expected: '',
      },
      // 不含下划线和星号的普通URL
      {
        input: 'https://example.com',
        expected: 'https://example.com',
      },
      {
        input: 'https://www.example.com/path/to/resource',
        expected: 'https://www.example.com/path/to/resource',
      },
      // 仅包含下划线
      {
        input: '_',
        expected: '&#x5f;',
      },
      {
        input: '___',
        expected: '&#x5f;&#x5f;&#x5f;',
      },
      // 仅包含星号
      {
        input: '*',
        expected: '&#x2a;',
      },
      {
        input: '***',
        expected: '&#x2a;&#x2a;&#x2a;',
      },
      // URL中的常见模式
      {
        input: 'https://example.com/api_v1/users',
        expected: 'https://example.com/api&#x5f;v1/users',
      },
      {
        input: 'https://example.com/user_name/profile',
        expected: 'https://example.com/user&#x5f;name/profile',
      },
      {
        input: 'https://example.com/image_*_thumb.jpg',
        expected: 'https://example.com/image&#x5f;&#x2a;&#x5f;thumb.jpg',
      },
      // 复杂的URL结构
      {
        input: 'https://sub_domain.example.com/path_to_resource/file_name_v2.js',
        expected: 'https://sub&#x5f;domain.example.com/path&#x5f;to&#x5f;resource/file&#x5f;name&#x5f;v2.js',
      },
      // 邮箱中的下划线和星号
      {
        input: 'user_name@example.com',
        expected: 'user&#x5f;name@example.com',
      },
      {
        input: 'user*test@example.com',
        expected: 'user&#x2a;test@example.com',
      },
      // 边界情况：URL开头或结尾
      {
        input: '_https://example.com',
        expected: '&#x5f;https://example.com',
      },
      {
        input: 'https://example.com_',
        expected: 'https://example.com&#x5f;',
      },
      {
        input: '*https://example.com',
        expected: '&#x2a;https://example.com',
      },
      {
        input: 'https://example.com*',
        expected: 'https://example.com&#x2a;',
      },
      // URL参数中的下划线
      {
        input: 'https://example.com?param_name=value',
        expected: 'https://example.com?param&#x5f;name=value',
      },
      {
        input: 'https://example.com?name=value&other_param=test',
        expected: 'https://example.com?name=value&other&#x5f;param=test',
      },
    ];
    cases.forEach((item) => {
      const result = AutoLink.escapePreservedSymbol(item.input);
      expect(result).toBe(item.expected);
    });
  });



  it('makeHtml - 测试带协议的非法URL', () => {
    const autoLinkHookWithEngine = new AutoLink({
      config: {},
      globalConfig: {},
    }) as any;
    // 模拟引擎对象
    autoLinkHookWithEngine.$engine = {
      urlProcessor: (url: string) => url,
    };
    autoLinkHookWithEngine.$engine.$cherry = {
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

    // 非法的URL - 不以//开头，不符合URL.test规则
    const result = autoLinkHookWithEngine.makeHtml('http:invalid-url');
    // 非法URL应该原样返回
    expect(result).toBe('http:invalid-url');
  });

  it('makeHtml - 测试默认返回值分支', () => {
    const autoLinkHookWithEngine = new AutoLink({
      config: {},
      globalConfig: {},
    }) as any;
    // 模拟引擎对象
    autoLinkHookWithEngine.$engine = {
      urlProcessor: (url: string) => url,
    };
    // 模拟cherry对象
    autoLinkHookWithEngine.$engine.$cherry = {
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

    // 测试一个会走到默认返回分支的情况
    // 这需要触发所有其他分支都不匹配的情况
    const result = autoLinkHookWithEngine.makeHtml('test@@example.com');
    // 非法格式应该原样返回
    expect(result).toBe('test@@example.com');
  });

  it('renderLink - 测试enableShortLink功能', () => {
    const autoLinkShort = new AutoLink({
      config: {
        enableShortLink: true,
        shortLinkLength: 15,
      },
      globalConfig: {},
    }) as any;
    autoLinkShort.$engine = {
      urlProcessor: (url: string) => url,
    };
    autoLinkShort.$engine.$cherry = {
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

    // 长URL应该被截断
    const longUrl = 'https://www.example.com/very/long/path/to/resource';
    const result = autoLinkShort.renderLink(longUrl);
    // 应该显示前15个字符（去掉协议头）+ ...
    expect(result).toContain('www.example.com...');
    expect(result).toContain('title=');
    expect(result).toContain('href=');
  });

  it('renderLink - 测试短链接不显示省略号', () => {
    const autoLinkShort = new AutoLink({
      config: {
        enableShortLink: true,
        shortLinkLength: 30,
      },
      globalConfig: {},
    }) as any;
    autoLinkShort.$engine = {
      urlProcessor: (url: string) => url,
    };
    autoLinkShort.$engine.$cherry = {
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

    // 短URL不应该被截断
    const shortUrl = 'https://example.com';
    const result = autoLinkShort.renderLink(shortUrl);
    expect(result).toContain('example.com');
    expect(result).not.toContain('...');
  });

  it('makeHtml - 测试空地址或不合法地址', () => {
    const hook = new AutoLink({
      config: {},
      globalConfig: {},
    }) as any;
    hook.$engine = {
      urlProcessor: (url: string) => url,
    };
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

    // 不被尖括号包裹，不带协议头，且不以www.开头
    const result = hook.makeHtml('example.com');
    expect(result).toBe('example.com');
  });

  it('makeHtml - 测试javascript:协议', () => {
    const hook = new AutoLink({
      config: {},
      globalConfig: {},
    }) as any;
    hook.$engine = {
      urlProcessor: (url: string) => url,
    };
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

    // javascript:协议应该被忽略
    const result = hook.makeHtml('<javascript:void(0)>');
    expect(result).toBe('<javascript:void(0)>');
  });

  it('makeHtml - 测试mailto:协议但非法邮箱', () => {
    const hook = new AutoLink({
      config: {},
      globalConfig: {},
    }) as any;
    hook.$engine = {
      urlProcessor: (url: string) => url,
    };
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

    // 非法邮箱地址
    const result = hook.makeHtml('mailto:not-a-valid-email');
    expect(result).toBe('mailto:not-a-valid-email');
  });

  it('makeHtml - 测试协议为空且为邮箱', () => {
    const hook = new AutoLink({
      config: {},
      globalConfig: {},
    }) as any;
    hook.$engine = {
      urlProcessor: (url: string) => url,
    };
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

    // 协议为空，但地址是邮箱
    const result = hook.makeHtml('test@example.com');
    expect(result).toContain('test@example.com');
  });

  it('makeHtml - 测试协议为空且为无协议头URL', () => {
    const hook = new AutoLink({
      config: {},
      globalConfig: {},
    }) as any;
    hook.$engine = {
      urlProcessor: (url: string) => url,
    };
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

    // 协议为空，地址不以斜杠开头
    const result = hook.makeHtml('www.example.com');
    expect(result).toContain('www.example.com');
  });

  it('makeHtml - 测试协议为空且被<>包裹的邮箱', () => {
    const hook = new AutoLink({
      config: {},
      globalConfig: {},
    }) as any;
    hook.$engine = {
      urlProcessor: (url: string) => url,
    };
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

    // 被<>包裹的邮箱
    const result = hook.makeHtml('<test@example.com>');
    expect(result).toContain('href="mailto:');
    expect(result).toContain('test@example.com');
  });

  it('makeHtml - 测试协议为空且被<>包裹的URL', () => {
    const hook = new AutoLink({
      config: {},
      globalConfig: {},
    }) as any;
    hook.$engine = {
      urlProcessor: (url: string) => url,
    };
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

    // 被<>包裹的完整URL
    const result = hook.makeHtml('<https://example.com>');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('https://example.com');
  });

  it('makeHtml - 测试协议为空且被<>包裹的URL - URL_NO_SLASH', () => {
    const hook = new AutoLink({
      config: {},
      globalConfig: {},
    }) as any;
    hook.$engine = {
      urlProcessor: (url: string) => url,
    };
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

    // 被<>包裹的完整URL会触发URL.test(address)，返回true
    const result = hook.makeHtml('<https://example.com/path>');
    expect(result).toContain('href="https://example.com/path"');
    expect(result).toContain('https://example.com/path');
  });

  it('makeHtml - 测试协议为空且被<>包裹的无协议头URL会返回原字符串', () => {
    const hook = new AutoLink({
      config: {},
      globalConfig: {},
    }) as any;
    hook.$engine = {
      urlProcessor: (url: string) => url,
    };
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

    // 被<>包裹的无协议头URL - 实际上不会被转换，因为www.example.com不符合URL.test()或URL_NO_SLASH.test()
    // 因为URL_INLINE_NO_SLASH不包含在尖括号内的完整匹配
    // 所以这会返回原字符串，覆盖行183
    const result = hook.makeHtml('<www.example.com>');
    expect(result).toBe('<www.example.com>');
  });

  it('makeHtml - 测试协议不为空的合法URL', () => {
    const hook = new AutoLink({
      config: {},
      globalConfig: {},
    }) as any;
    hook.$engine = {
      urlProcessor: (url: string) => url,
    };
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

    // 带协议的合法URL
    const result = hook.makeHtml('<https://example.com/path>');
    expect(result).toContain('href="https://example.com/path"');
    expect(result).toContain('https://example.com/path');
  });

  it('makeHtml - 测试带协议的URL不被<>包裹', () => {
    const hook = new AutoLink({
      config: {},
      globalConfig: {},
    }) as any;
    hook.$engine = {
      urlProcessor: (url: string) => url,
    };
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

    // 不被<>包裹的带协议URL
    const result = hook.makeHtml('https://example.com/path');
    expect(result).toContain('href="https://example.com/path"');
    expect(result).toContain('https://example.com/path');
  });

  it('renderLink - 测试不启用短链接时使用完整URL', () => {
    const hook = new AutoLink({
      config: {
        enableShortLink: false,
      },
      globalConfig: {},
    }) as any;
    hook.$engine = {
      urlProcessor: (url: string) => url,
    };
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

    // 不启用短链接，应该显示完整URL
    const longUrl = 'https://www.example.com/very/long/path/to/resource';
    const result = hook.renderLink(longUrl);
    expect(result).toContain('https://www.example.com/very/long/path/to/resource');
    expect(result).not.toContain('...');
  });

  it('renderLink - 测试自定义链接文本', () => {
    const hook = new AutoLink({
      config: {
        enableShortLink: true,
        shortLinkLength: 15,
      },
      globalConfig: {},
    }) as any;
    hook.$engine = {
      urlProcessor: (url: string) => url,
    };
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

    // 传入自定义文本参数，应该使用自定义文本而不是URL
    const url = 'https://example.com/very/long/path';
    const customText = 'Click Here';
    const result = hook.renderLink(url, customText);
    expect(result).toContain('>Click Here<');
    expect(result).not.toContain('...');
  });

  it('makeHtml - 测试target和rel属性', () => {
    const hook = new AutoLink({
      config: {
        target: '_self',
        rel: 'nofollow',
      },
      globalConfig: {},
    }) as any;
    hook.$engine = {
      urlProcessor: (url: string) => url,
    };
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

    const result = hook.makeHtml('https://example.com');
    expect(result).toContain('target="_self"');
    expect(result).toContain('rel="nofollow"');
  });

  it('makeHtml - 测试openNewPage配置', () => {
    const hook = new AutoLink({
      config: {
        openNewPage: true,
      },
      globalConfig: {},
    }) as any;
    hook.$engine = {
      urlProcessor: (url: string) => url,
    };
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

    const result = hook.makeHtml('https://example.com');
    expect(result).toContain('target="_blank"');
  });

  it('makeHtml - 测试attrRender返回自定义属性', () => {
    const hook = new AutoLink({
      config: {},
      globalConfig: {},
    }) as any;
    hook.$engine = {
      urlProcessor: (url: string) => url,
    };
    hook.$engine.$cherry = {
      options: {
        engine: {
          syntax: {
            autoLink: {
              attrRender: (url: string, _text: string) => `data-url="${url}" class="custom-link"`,
            },
          },
        },
      },
    };

    const result = hook.makeHtml('https://example.com');
    expect(result).toContain('data-url="https://example.com"');
    expect(result).toContain('class="custom-link"');
  });

  it('makeHtml - 测试更多带协议的非法URL', () => {
    const hook = new AutoLink({
      config: {},
      globalConfig: {},
    }) as any;
    hook.$engine = {
      urlProcessor: (url: string) => url,
    };
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

    // 测试带邮箱地址的http协议
    const result1 = hook.makeHtml('http://user@example.com');
    expect(result1).toContain('user@example.com');
  });

  it('makeHtml - 测试URL_NO_SLASH.test(address)失败的情况', () => {
    const hook = new AutoLink({
      config: {},
      globalConfig: {},
    }) as any;
    hook.$engine = {
      urlProcessor: (url: string) => url,
    };
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

    // 以斜杠开头的地址，不符合URL_NO_SLASH
    const result = hook.makeHtml('example.com/path');
    expect(result).toBe('example.com/path');
  });
});
