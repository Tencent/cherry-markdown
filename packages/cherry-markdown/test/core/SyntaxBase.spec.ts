import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SyntaxBase, { HOOKS_TYPE_LIST } from '../../src/core/SyntaxBase';
import { assignHookClassProps } from '../helpers/hookClass';

// ============ 辅助函数 ============

/** 定义测试用的 SyntaxBase 子类 */
const defineTestSyntaxClass = (hookName = 'testHook', hookType = HOOKS_TYPE_LIST.SEN) => {
  class TestSyntax extends SyntaxBase {
    rule() {
      return {
        begin: '^',
        end: '$',
        content: 'test',
        reg: /^test$/,
      };
    }
  }
  return assignHookClassProps(TestSyntax, { hookName, hookType });
};

/**
 * 创建测试用 SyntaxBase 实例
 * new 收敛在工厂内，测试侧只关心实例行为
 */
const createTestSyntaxInstance = (
  editorConfig: object = createEditorConfig(),
  hookName = 'testHook',
  hookType = HOOKS_TYPE_LIST.SEN,
) => {
  return new (defineTestSyntaxClass(hookName, hookType))(editorConfig);
};

/** 创建编辑器配置 */
const createEditorConfig = (overrides = {}) => ({
  externals: {},
  config: {},
  globalConfig: {},
  ...overrides,
});

// ============ 测试用例 ============

describe('core/SyntaxBase', () => {
  describe('HOOKS_TYPE_LIST 常量', () => {
    it('应该定义正确的 hook 类型', () => {
      expect(HOOKS_TYPE_LIST.SEN).toBe('sentence');
      expect(HOOKS_TYPE_LIST.PAR).toBe('paragraph');
      expect(HOOKS_TYPE_LIST.DEFAULT).toBe('sentence');
    });
  });

  describe('静态属性', () => {
    it('应该有默认的 HOOK_NAME', () => {
      expect(SyntaxBase.HOOK_NAME).toBe('default');
    });

    it('应该有默认的 HOOK_TYPE', () => {
      expect(SyntaxBase.HOOK_TYPE).toBe(HOOKS_TYPE_LIST.DEFAULT);
    });
  });

  describe('constructor', () => {
    it('应该正确初始化并调用 rule 方法', () => {
      const config = createEditorConfig();
      const instance = createTestSyntaxInstance(config);

      expect(instance.RULE).toBeDefined();
      expect(instance.RULE.begin).toBe('^');
      expect(instance.RULE.end).toBe('$');
      expect(instance.RULE.reg).toBeInstanceOf(RegExp);
    });

    it('应该处理空的编辑器配置', () => {
      const instance = createTestSyntaxInstance({});

      expect(instance.RULE).toBeDefined();
    });
  });

  describe('getType', () => {
    it.each([
      [HOOKS_TYPE_LIST.SEN, 'sentence'],
      [HOOKS_TYPE_LIST.PAR, 'paragraph'],
    ])('应该返回正确的类型 %s', (hookType, expected) => {
      const instance = createTestSyntaxInstance(createEditorConfig(), 'test', hookType);

      expect(instance.getType()).toBe(expected);
    });

    it('当 HOOK_TYPE 未定义时应返回默认类型', () => {
      class NoTypeSyntax extends SyntaxBase {}
      assignHookClassProps(NoTypeSyntax, { hookName: 'noType' });
      const instance = new NoTypeSyntax(createEditorConfig());

      expect(instance.getType()).toBe(HOOKS_TYPE_LIST.DEFAULT);
    });
  });

  describe('getName', () => {
    it('应该返回类的 HOOK_NAME', () => {
      const instance = createTestSyntaxInstance(createEditorConfig(), 'myHook');

      expect(instance.getName()).toBe('myHook');
    });
  });

  describe('afterInit', () => {
    it('应该在传入函数时调用回调', () => {
      const instance = createTestSyntaxInstance();
      const callback = vi.fn();

      instance.afterInit(callback);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it.each([null, undefined, 'string', 123, {}])('传入非函数值 %j 时不应该报错', (value) => {
      const instance = createTestSyntaxInstance();

      expect(() => instance.afterInit(value as any)).not.toThrow();
    });
  });

  describe('setLocale', () => {
    it('应该正确设置 locale', () => {
      const instance = createTestSyntaxInstance();

      instance.setLocale('zh-CN');

      expect(instance.$locale).toBe('zh-CN');
    });

    it('应该能够覆盖已设置的 locale', () => {
      const instance = createTestSyntaxInstance();

      instance.setLocale('zh-CN');
      instance.setLocale('en-US');

      expect(instance.$locale).toBe('en-US');
    });
  });

  describe('生命周期函数', () => {
    it.each([
      { method: 'beforeMakeHtml', input: 'test string' },
      { method: 'makeHtml', input: 'test string' },
      { method: 'afterMakeHtml', input: 'test string' },
    ])('$method 应该返回原字符串', ({ method, input }) => {
      const instance = createTestSyntaxInstance();

      expect((instance as any)[method](input)).toBe(input);
    });

    it('生命周期方法应该可以在子类中重写', () => {
      class CustomLifecycleSyntax extends SyntaxBase {
        beforeMakeHtml(str: string) {
          return `before: ${str}`;
        }

        makeHtml(str: string) {
          return `html: ${str}`;
        }

        afterMakeHtml(str: string) {
          return `after: ${str}`;
        }
      }
      assignHookClassProps(CustomLifecycleSyntax, { hookName: 'customLifecycle' });
      const instance = new CustomLifecycleSyntax(createEditorConfig());

      expect(instance.beforeMakeHtml('test')).toBe('before: test');
      expect(instance.makeHtml('test')).toBe('html: test');
      expect(instance.afterMakeHtml('test')).toBe('after: test');
    });
  });

  describe('onKeyDown / getOnKeyDown', () => {
    it('getOnKeyDown 应该返回 onKeyDown 方法', () => {
      const instance = createTestSyntaxInstance();

      expect(instance.getOnKeyDown()).toBe(instance.onKeyDown);
    });

    it('onKeyDown 应该可以在子类中重写', () => {
      class KeyDownSyntax extends SyntaxBase {
        onKeyDown(e: KeyboardEvent, str: string) {
          return `processed: ${str}`;
        }
      }
      assignHookClassProps(KeyDownSyntax, { hookName: 'keyDown' });
      const instance = new KeyDownSyntax(createEditorConfig());

      const event = new KeyboardEvent('keydown');
      expect(instance.onKeyDown(event, 'test')).toBe('processed: test');
    });

    it('onKeyDown 默认返回 undefined', () => {
      const instance = createTestSyntaxInstance();

      const event = new KeyboardEvent('keydown');
      expect(instance.onKeyDown(event, 'test')).toBeUndefined();
    });
  });

  describe('getAttributesTest', () => {
    const validAttributes = [
      'color',
      'fontSize',
      'font-size',
      'id',
      'title',
      'class',
      'target',
      'underline',
      'line-through',
      'overline',
      'sub',
      'super',
    ];

    const invalidAttributes = ['onclick', 'href', 'style', 'data-attr', 'onload', 'src'];

    it.each(validAttributes)('应该匹配有效属性: %s', (attr) => {
      const instance = createTestSyntaxInstance();
      const regex = instance.getAttributesTest();

      expect(regex.test(attr)).toBe(true);
    });

    it.each(invalidAttributes)('应该拒绝无效属性: %s', (attr) => {
      const instance = createTestSyntaxInstance();
      const regex = instance.getAttributesTest();

      expect(regex.test(attr)).toBe(false);
    });
  });

  describe('$testAttributes', () => {
    it('应该在属性有效时调用回调函数', () => {
      const instance = createTestSyntaxInstance();
      const callback = vi.fn();

      instance.$testAttributes('color', callback);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('应该在属性无效时不调用回调函数', () => {
      const instance = createTestSyntaxInstance();
      const callback = vi.fn();

      instance.$testAttributes('onclick', callback);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('getAttributes', () => {
    it('应该返回包含 attrs 和 str 的对象', () => {
      const instance = createTestSyntaxInstance();

      const result = instance.getAttributes('test string');

      expect(result).toHaveProperty('attrs');
      expect(result).toHaveProperty('str');
      expect(result.str).toBe('test string');
      expect(result.attrs).toEqual({});
    });

    it.each(['hello world', '', '   ', 'markdown **bold** text'])('应该原样返回输入字符串: %j', (input) => {
      const instance = createTestSyntaxInstance();

      const result = instance.getAttributes(input);

      expect(result.str).toBe(input);
    });
  });

  describe('MathJax 配置', () => {
    beforeEach(() => {
      SyntaxBase.setMathJaxConfig(false);
    });

    afterEach(() => {
      SyntaxBase.setMathJaxConfig(false);
    });

    it('getMathJaxConfig 应该返回当前配置', () => {
      expect(SyntaxBase.getMathJaxConfig()).toBe(false);

      SyntaxBase.setMathJaxConfig(true);
      expect(SyntaxBase.getMathJaxConfig()).toBe(true);
    });

    it.each([true, false])('setMathJaxConfig 应该正确设置配置为 %s', (value) => {
      SyntaxBase.setMathJaxConfig(value);
      expect(SyntaxBase.getMathJaxConfig()).toBe(value);
    });
  });

  describe('test', () => {
    it('应该在字符串匹配规则时返回 true', () => {
      const instance = createTestSyntaxInstance();

      expect(instance.test('test')).toBe(true);
    });

    it('应该在字符串不匹配规则时返回 false', () => {
      const instance = createTestSyntaxInstance();

      expect(instance.test('no match')).toBe(false);
    });

    it('应该在 RULE.reg 未定义时返回 false', () => {
      class NoRegSyntax extends SyntaxBase {
        rule() {
          return { begin: '', end: '', content: '' };
        }
      }
      assignHookClassProps(NoRegSyntax, { hookName: 'noReg' });
      const instance = new NoRegSyntax(createEditorConfig());

      expect(instance.test('test')).toBe(false);
    });

    it('应该在 RULE.reg 为 null 时返回 false', () => {
      class NullRegSyntax extends SyntaxBase {
        rule() {
          return { begin: '', end: '', content: '', reg: null as any };
        }
      }
      assignHookClassProps(NullRegSyntax, { hookName: 'nullReg' });
      const instance = new NullRegSyntax(createEditorConfig());

      expect(instance.test('test')).toBe(false);
    });
  });

  describe('rule', () => {
    it('基类 rule 方法应该返回默认规则', () => {
      const instance = new SyntaxBase(createEditorConfig());
      const rule = instance.rule(createEditorConfig());

      expect(rule.begin).toBe('');
      expect(rule.end).toBe('');
      expect(rule.content).toBe('');
      expect(rule.reg).toBeInstanceOf(RegExp);
      expect(rule.reg.source).toBe('(?:)');
    });

    it('rule 方法应该接收 editorConfig 参数', () => {
      const config = createEditorConfig({ customOption: true });
      const instance = createTestSyntaxInstance(config);

      expect(instance.RULE).toBeDefined();
    });
  });

  describe('mounted', () => {
    it('mounted 方法应该可以被调用', () => {
      const instance = createTestSyntaxInstance();

      expect(() => instance.mounted()).not.toThrow();
    });

    it('mounted 方法可以在子类中重写', () => {
      class MountedSyntax extends SyntaxBase {
        mounted() {
          return 'mounted called';
        }
      }
      assignHookClassProps(MountedSyntax, { hookName: 'mounted' });
      const instance = new MountedSyntax(createEditorConfig());

      expect(instance.mounted()).toBe('mounted called');
    });
  });

  describe('$engine 属性', () => {
    it('应该能够设置 $engine', () => {
      const instance = createTestSyntaxInstance();
      const mockEngine = { name: 'testEngine' };

      (instance as any).$engine = mockEngine;

      expect((instance as any).$engine).toEqual(mockEngine);
    });

    it('$engine 默认为 undefined', () => {
      const instance = createTestSyntaxInstance();

      expect((instance as any).$engine).toBeUndefined();
    });
  });

  describe('$externals 属性', () => {
    it('可以在实例化后设置 $externals', () => {
      const instance = createTestSyntaxInstance();

      instance.$externals = { customLib: {} };

      expect(instance.$externals).toEqual({ customLib: {} });
    });
  });
});
