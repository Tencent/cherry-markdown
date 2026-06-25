import { describe, it, expect, vi, beforeEach } from 'vitest';
import HookCenter from '../../src/core/HookCenter';
import SyntaxBase from '../../src/core/SyntaxBase';
import ParagraphBase from '../../src/core/ParagraphBase';
import Logger from '@/Logger';

// 返回值常量
const WARN_DUPLICATED = -1;
const WARN_NOT_A_VALID_HOOK = -2;

// Mock Logger
vi.mock('@/Logger', () => ({
  default: {
    warn: vi.fn(),
  },
}));

// ============ 辅助函数 ============

/** 创建 mock cherry 实例 */
const createMockCherry = (locale = 'zh-CN') => ({ locale });

/** 创建基础编辑器配置 */
const createEditorConfig = (overrides = {}) => ({
  externals: {},
  engine: {
    syntax: {},
    global: {},
    ...overrides,
  },
});

/** 创建 mock SyntaxBase hook 类 */
const createMockHookClass = (hookName: string) => {
  return class MockHook extends SyntaxBase {
    static HOOK_NAME = hookName;
    rule() {
      return { regex: new RegExp('') };
    }
  };
};

/** 创建 mock ParagraphBase hook 类 */
const createMockParagraphHook = (hookName: string) => {
  return class MockHook extends ParagraphBase {
    static HOOK_NAME = hookName;
    rule() {
      return { regex: new RegExp('') };
    }
  };
};

/** 为 Hook 类添加自定义标记 */
const markAsCustomHook = (HookClass: any) => {
  Object.defineProperty(HookClass, 'Cherry$$CUSTOM', {
    value: true,
    writable: false,
    configurable: true,
    enumerable: false,
  });
  return HookClass;
};

/** 创建 HookCenter 实例 */
const createHookCenter = (
  hooksConfig: any[] = [],
  editorConfig = createEditorConfig(),
  cherry = createMockCherry(),
) => {
  return new HookCenter(hooksConfig, editorConfig, cherry);
};

// ============ 测试用例 ============

describe('core/HookCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('应该正确初始化基本属性', () => {
      const hookCenter = createHookCenter([createMockHookClass('testHook')]);

      expect(hookCenter.getHookList()).toBeDefined();
      expect(hookCenter.getHookNameList()).toBeDefined();
      expect(hookCenter.$locale).toBe('zh-CN');
      expect(hookCenter.$cherry).toBeDefined();
    });

    it.each([
      ['字符串', 'string'],
      ['对象', {}],
      ['数字', 123],
      ['null', null],
    ])('应该拒绝非数组类型的 hooksConfig: %s', (_, config) => {
      expect(() => createHookCenter(config as any)).toThrow();
    });

    it('应该同时注册内置 hooks 和自定义 hooks', () => {
      const InternalHook = createMockHookClass('internalHook');
      const CustomHook = createMockHookClass('customHook');
      const editorConfig = createEditorConfig({
        customSyntax: { customHook: CustomHook },
      });

      const hookCenter = createHookCenter([InternalHook], editorConfig);

      expect(hookCenter.getHookNameList().internalHook).toBeDefined();
      expect(hookCenter.getHookNameList().customHook).toBeDefined();
    });
  });

  describe('registerInternalHooks', () => {
    it('应该按顺序注册所有内部 hooks', () => {
      const Hook1 = createMockHookClass('hook1');
      const Hook2 = createMockHookClass('hook2');
      const hookCenter = createHookCenter([Hook1, Hook2]);

      expect(hookCenter.getHookNameList().hook1).toBeDefined();
      expect(hookCenter.getHookNameList().hook2).toBeDefined();
    });

    it('应该对重复的内部 hook 发出警告', () => {
      const HookClass = createMockHookClass('duplicateHook');
      createHookCenter([HookClass, HookClass]);

      expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('Duplicate hook name [duplicateHook]'));
    });

    it('应该对无效的内部 hook 发出警告', () => {
      createHookCenter(['invalidHook' as any]);

      expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('is not a valid hook'));
    });
  });

  describe('registerCustomHooks', () => {
    describe('空配置处理', () => {
      it.each([null, undefined])('应该在 customSyntax 为 %s 时跳过', (customSyntax) => {
        const editorConfig = createEditorConfig({ customSyntax });
        const hookCenter = createHookCenter([], editorConfig);

        expect(hookCenter.getHookList()).toBeDefined();
      });

      it('应该处理空对象 customSyntax', () => {
        const editorConfig = createEditorConfig({ customSyntax: {} });
        const hookCenter = createHookCenter([], editorConfig);

        expect(hookCenter.getHookList()).toBeDefined();
      });
    });

    describe('直接注册 Hook 类', () => {
      it('应该直接注册 SyntaxBase 类型的自定义 hook', () => {
        const CustomHook = createMockHookClass('customHook');
        const editorConfig = createEditorConfig({ customSyntax: { customHook: CustomHook } });
        const hookCenter = createHookCenter([], editorConfig);

        expect(hookCenter.getHookNameList().customHook).toBeDefined();
      });

      it('应该直接注册 ParagraphBase 类型的自定义 hook', () => {
        const CustomHook = createMockParagraphHook('customParagraphHook');
        const editorConfig = createEditorConfig({ customSyntax: { customParagraphHook: CustomHook } });
        const hookCenter = createHookCenter([], editorConfig);

        expect(hookCenter.getHookNameList().customParagraphHook).toBeDefined();
        expect(hookCenter.getHookList().paragraph).toBeDefined();
      });
    });

    describe('配置对象形式的 Hook', () => {
      it('应该处理 force 配置', () => {
        const editorConfig = createEditorConfig({
          customSyntax: { forceHook: { syntaxClass: createMockHookClass('forceHook'), force: true } },
        });
        const hookCenter = createHookCenter([], editorConfig);

        expect(hookCenter.getHookNameList().forceHook).toBeDefined();
      });

      it('应该处理 before 配置：在指定 hook 之前插入', () => {
        const BaseHook = createMockHookClass('baseHook');
        const BeforeHook = createMockHookClass('beforeHook');
        const editorConfig = createEditorConfig({
          customSyntax: { beforeHook: { syntaxClass: BeforeHook, before: 'baseHook' } },
        });
        const hookCenter = createHookCenter([BaseHook], editorConfig);
        const hooks = hookCenter.getHookList().sentence;

        expect(hooks[0].getName()).toBe('beforeHook');
        expect(hooks[1].getName()).toBe('baseHook');
      });

      it('应该处理 after 配置：在指定 hook 之后插入', () => {
        const BaseHook = createMockHookClass('baseHook');
        const AfterHook = createMockHookClass('afterHook');
        const editorConfig = createEditorConfig({
          customSyntax: { afterHook: { syntaxClass: AfterHook, after: 'baseHook' } },
        });
        const hookCenter = createHookCenter([BaseHook], editorConfig);
        const hooks = hookCenter.getHookList().sentence;

        expect(hooks[0].getName()).toBe('baseHook');
        expect(hooks[1].getName()).toBe('afterHook');
      });
    });

    describe('无效配置处理', () => {
      it.each([
        ['字符串', 'string'],
        ['null', null],
        ['undefined', undefined],
        ['无效的 syntaxClass 字符串', { syntaxClass: 'InvalidClass' }],
        ['无效的 syntaxClass 类', { syntaxClass: class InvalidClass {} }],
      ])('应该忽略无效的自定义 hook 配置: %s', (_, customSyntax) => {
        const editorConfig = createEditorConfig({
          customSyntax: { invalidHook: customSyntax as any },
        });
        const hookCenter = createHookCenter([], editorConfig);

        expect(hookCenter.getHookNameList().invalidHook).toBeUndefined();
      });
    });
  });

  describe('register', () => {
    describe('有效 Hook 注册', () => {
      it('应该成功注册 SyntaxBase 类型的 hook', () => {
        const HookClass = createMockHookClass('syntaxHook');
        const hookCenter = createHookCenter();

        hookCenter.register(HookClass, createEditorConfig());

        expect(hookCenter.getHookNameList().syntaxHook).toBeDefined();
        expect(hookCenter.getHookList().sentence).toHaveLength(1);
      });

      it('应该成功注册 ParagraphBase 类型的 hook', () => {
        const HookClass = createMockParagraphHook('paragraphHook');
        const hookCenter = createHookCenter();

        hookCenter.register(HookClass, createEditorConfig());

        expect(hookCenter.getHookNameList().paragraphHook).toBeDefined();
        expect(hookCenter.getHookList().paragraph).toHaveLength(1);
      });

      it('应该成功注册函数式 hook（返回 Hook 实例的函数）', () => {
        const HookClass = createMockHookClass('funcHook');
        const hookCenter = createHookCenter();

        hookCenter.register(() => new HookClass({ config: {}, globalConfig: {} }), createEditorConfig());

        expect(hookCenter.getHookNameList().funcHook).toBeDefined();
      });

      it('应该使用 syntax 配置初始化 hook', () => {
        const HookClass = createMockHookClass('configuredHook');
        const editorConfig = createEditorConfig({ syntax: { configuredHook: { customOption: true } } });
        const hookCenter = createHookCenter([], editorConfig);

        hookCenter.register(HookClass, editorConfig);

        expect(hookCenter.getHookNameList().configuredHook).toBeDefined();
      });
    });

    describe('无效 Hook 处理', () => {
      it.each([
        ['对象', {}],
        ['null', null],
        ['字符串', 'string'],
      ])('应该拒绝非函数非类的参数: %s', (_, value) => {
        const hookCenter = createHookCenter();

        expect(hookCenter.register(value as any, createEditorConfig())).toBe(WARN_NOT_A_VALID_HOOK);
      });

      it.each([
        ['null', () => null],
        ['普通对象', () => ({})],
      ])('应该拒绝返回无效实例的函数 hook: %s', (_, funcHook) => {
        const hookCenter = createHookCenter();

        expect(hookCenter.register(funcHook, createEditorConfig())).toBe(WARN_NOT_A_VALID_HOOK);
      });
    });

    describe('禁用 Hook 处理', () => {
      it('应该跳过被禁用的内置 hook（syntax 配置为 false）', () => {
        const HookClass = createMockHookClass('disabledHook');
        const editorConfig = createEditorConfig({ syntax: { disabledHook: false } });
        const hookCenter = createHookCenter([], editorConfig);

        hookCenter.register(HookClass, editorConfig);

        expect(hookCenter.getHookNameList().disabledHook).toBeUndefined();
      });

      it('应该允许被禁用的自定义 hook 注册（使用 force 选项）', () => {
        const CustomHook = markAsCustomHook(createMockHookClass('disabledCustomHook'));
        const editorConfig = createEditorConfig({ syntax: { disabledCustomHook: false } });
        const hookCenter = createHookCenter([], editorConfig);

        hookCenter.register(CustomHook, createEditorConfig(), { force: true });

        expect(hookCenter.getHookNameList().disabledCustomHook).toBeDefined();
      });
    });

    describe('重复 Hook 处理', () => {
      it('应该拒绝重复的内置 hook', () => {
        const HookClass = createMockHookClass('duplicateHook');
        const hookCenter = createHookCenter();

        hookCenter.register(HookClass, createEditorConfig());
        const result = hookCenter.register(HookClass, createEditorConfig());

        expect(result).toBe(WARN_DUPLICATED);
      });

      it('应该拒绝重复的自定义 hook（未设置 force）', () => {
        const BaseHook = createMockHookClass('baseHook');
        const CustomHook = markAsCustomHook(createMockHookClass('baseHook'));
        const hookCenter = createHookCenter([BaseHook]);

        expect(hookCenter.register(CustomHook, createEditorConfig(), { force: false })).toBe(WARN_DUPLICATED);
        expect(hookCenter.register(CustomHook, createEditorConfig(), {})).toBe(WARN_DUPLICATED);
      });

      it('应该允许自定义 hook 强制覆盖内置 hook（设置 force: true）', () => {
        const BaseHook = createMockHookClass('baseHook');
        const CustomHook = markAsCustomHook(createMockHookClass('baseHook'));
        const hookCenter = createHookCenter([BaseHook]);

        hookCenter.register(CustomHook, createEditorConfig(), { force: true });

        const hooks = hookCenter.getHookList().sentence;
        expect(hooks).toHaveLength(1);
        expect(hooks[0].getName()).toBe('baseHook');
      });
    });

    describe('Hook 插入位置', () => {
      describe('before 配置', () => {
        it('应该在指定 hook 之前插入', () => {
          const Hook1 = createMockHookClass('hook1');
          const Hook2 = createMockHookClass('hook2');
          const Hook3 = markAsCustomHook(createMockHookClass('hook3'));
          const hookCenter = createHookCenter([Hook1, Hook2]);

          hookCenter.register(Hook3, createEditorConfig(), { before: 'hook2' });

          const hooks = hookCenter.getHookList().sentence;
          expect(hooks.map((h) => h.getName())).toEqual(['hook1', 'hook3', 'hook2']);
        });

        it('应该在找不到目标 hook 时追加到末尾并发出警告', () => {
          const Hook1 = createMockHookClass('hook1');
          const Hook2 = markAsCustomHook(createMockHookClass('hook2'));
          const hookCenter = createHookCenter([Hook1]);

          hookCenter.register(Hook2, createEditorConfig(), { before: 'nonExistent' });

          const hooks = hookCenter.getHookList().sentence;
          expect(hooks.map((h) => h.getName())).toEqual(['hook1', 'hook2']);
          expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('Cannot find hook named [nonExistent]'));
        });
      });

      describe('after 配置', () => {
        it('应该在指定 hook 之后插入', () => {
          const Hook1 = createMockHookClass('hook1');
          const Hook2 = createMockHookClass('hook2');
          const Hook3 = markAsCustomHook(createMockHookClass('hook3'));
          const hookCenter = createHookCenter([Hook1, Hook2]);

          hookCenter.register(Hook3, createEditorConfig(), { after: 'hook1' });

          const hooks = hookCenter.getHookList().sentence;
          expect(hooks.map((h) => h.getName())).toEqual(['hook1', 'hook3', 'hook2']);
        });

        it('应该在最后一个 hook 之后插入', () => {
          const Hook1 = createMockHookClass('hook1');
          const Hook2 = markAsCustomHook(createMockHookClass('hook2'));
          const hookCenter = createHookCenter([Hook1]);

          hookCenter.register(Hook2, createEditorConfig(), { after: 'hook1' });

          const hooks = hookCenter.getHookList().sentence;
          expect(hooks.map((h) => h.getName())).toEqual(['hook1', 'hook2']);
        });

        it('应该在找不到目标 hook 时追加到末尾并发出警告', () => {
          const Hook1 = createMockHookClass('hook1');
          const Hook2 = markAsCustomHook(createMockHookClass('hook2'));
          const hookCenter = createHookCenter([Hook1]);

          hookCenter.register(Hook2, createEditorConfig(), { after: 'nonExistent' });

          const hooks = hookCenter.getHookList().sentence;
          expect(hooks.map((h) => h.getName())).toEqual(['hook1', 'hook2']);
          expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('Cannot find hook named [nonExistent]'));
        });
      });

      describe('无位置配置', () => {
        it('内置 hook 应该直接追加到末尾', () => {
          const Hook1 = createMockHookClass('hook1');
          const Hook2 = createMockHookClass('hook2');
          const hookCenter = createHookCenter([Hook1]);

          hookCenter.register(Hook2, createEditorConfig());

          const hooks = hookCenter.getHookList().sentence;
          expect(hooks.map((h) => h.getName())).toEqual(['hook1', 'hook2']);
        });
      });
    });
  });

  describe('getHookList / getHookNameList', () => {
    it('应该返回正确的 hook 列表和名称映射', () => {
      const Hook1 = createMockHookClass('hook1');
      const Hook2 = createMockParagraphHook('hook2');
      const hookCenter = createHookCenter([Hook1, Hook2]);

      const hookList = hookCenter.getHookList();
      const hookNameList = hookCenter.getHookNameList();

      expect(hookList.sentence).toHaveLength(1);
      expect(hookList.paragraph).toHaveLength(1);
      expect(hookNameList.hook1).toEqual({ type: 'sentence' });
      expect(hookNameList.hook2).toEqual({ type: 'paragraph' });
    });
  });

  describe('警告日志', () => {
    it.each([
      [
        '重复 hook',
        () => {
          const HookClass = createMockHookClass('duplicateHook');
          createHookCenter([HookClass, HookClass]);
        },
        'Duplicate hook name [duplicateHook]',
      ],
      [
        '无效 hook',
        () => {
          createHookCenter(['invalid' as any]);
        },
        'is not a valid hook',
      ],
      [
        'before 找不到目标 hook',
        () => {
          const Hook = markAsCustomHook(createMockHookClass('testHook'));
          const hookCenter = createHookCenter();
          hookCenter.register(Hook, createEditorConfig(), { before: 'nonExistent' });
        },
        'Cannot find hook named [nonExistent]',
      ],
      [
        'after 找不到目标 hook',
        () => {
          const Hook = markAsCustomHook(createMockHookClass('testHook'));
          const hookCenter = createHookCenter();
          hookCenter.register(Hook, createEditorConfig(), { after: 'nonExistent' });
        },
        'Cannot find hook named [nonExistent]',
      ],
    ])('应该在 %s 时输出警告', (_, action, expectedMessage) => {
      action();
      expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining(expectedMessage));
    });
  });
});
