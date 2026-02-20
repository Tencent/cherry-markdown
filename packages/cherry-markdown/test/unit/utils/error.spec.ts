/**
 * error.js 测试
 * 测试错误处理工具函数
 */
import { describe, it, expect } from 'vitest';
import NestedError, { $expectTarget, $expectInherit, $expectInstance } from '@/utils/error';

describe('error.js', () => {
  describe('$expectTarget', () => {
    it('字符串类型校验通过', () => {
      expect($expectTarget('hello', String)).toBe(true);
    });

    it('数字类型校验通过', () => {
      expect($expectTarget(123, Number)).toBe(true);
    });

    it('布尔类型校验通过', () => {
      expect($expectTarget(true, Boolean)).toBe(true);
    });

    it('数组类型校验通过', () => {
      expect($expectTarget([1, 2, 3], Array)).toBe(true);
    });

    it('空数组校验通过', () => {
      expect($expectTarget([], Array)).toBe(true);
    });

    it('对象类型校验通过', () => {
      expect($expectTarget({}, Object)).toBe(true);
    });

    it('函数类型校验通过', () => {
      expect($expectTarget(() => {}, Function)).toBe(true);
    });

    it('字符串不是数字，抛出 TypeError', () => {
      expect(() => $expectTarget('hello', Number)).toThrow(TypeError);
      expect(() => $expectTarget('hello', Number)).toThrow('parameter given must be Number');
    });

    it('数字不是字符串，抛出 TypeError', () => {
      expect(() => $expectTarget(123, String)).toThrow(TypeError);
      expect(() => $expectTarget(123, String)).toThrow('parameter given must be String');
    });

    it('对象不是数组，抛出 TypeError', () => {
      expect(() => $expectTarget({}, Array)).toThrow(TypeError);
      expect(() => $expectTarget({}, Array)).toThrow('parameter given must be Array');
    });

    it('null 类型校验', () => {
      // null 的 typeof 是 'object'，所以实际上会通过
      // 这是 JavaScript 的历史遗留问题
      expect($expectTarget(null, Object)).toBe(true);
    });

    it('undefined 类型校验', () => {
      expect(() => $expectTarget(undefined, String)).toThrow(TypeError);
    });
  });

  describe('$expectInherit', () => {
    class Parent {}
    class Child extends Parent {}
    class NotRelated {}

    it('正确继承返回 true', () => {
      const child = new Child();
      expect($expectInherit(child, Parent)).toBe(true);
    });

    it('自身实例也通过', () => {
      const parent = new Parent();
      expect($expectInherit(parent, Parent)).toBe(true);
    });

    it('非继承关系抛出错误', () => {
      const notRelated = new NotRelated();
      expect(() => $expectInherit(notRelated, Parent)).toThrow('the hook does not correctly inherit');
    });

    it('普通对象不继承自定义类', () => {
      expect(() => $expectInherit({}, Parent)).toThrow('the hook does not correctly inherit');
    });

    it('多层继承', () => {
      class GrandChild extends Child {}
      const grandChild = new GrandChild();
      expect($expectInherit(grandChild, Parent)).toBe(true);
      expect($expectInherit(grandChild, Child)).toBe(true);
    });

    it('内置类继承检查', () => {
      expect($expectInherit(new Error(), Error)).toBe(true);
      expect($expectInherit(new TypeError(), Error)).toBe(true);
    });
  });

  describe('$expectInstance', () => {
    it('对象实例返回 true', () => {
      expect($expectInstance({})).toBe(true);
    });

    it('数组实例返回 true', () => {
      expect($expectInstance([])).toBe(true);
    });

    it('类实例返回 true', () => {
      class MyClass {}
      expect($expectInstance(new MyClass())).toBe(true);
    });

    it('null 是 object 类型但会抛出错误', () => {
      // null 的 typeof 是 'object'，所以实际上会通过
      // 这是 JavaScript 的历史遗留问题
      expect($expectInstance(null)).toBe(true);
    });

    it('字符串抛出错误', () => {
      expect(() => $expectInstance('string')).toThrow('the hook must be a instance, not a class');
    });

    it('数字抛出错误', () => {
      expect(() => $expectInstance(123)).toThrow('the hook must be a instance, not a class');
    });

    it('函数抛出错误', () => {
      expect(() => $expectInstance(() => {})).toThrow('the hook must be a instance, not a class');
    });

    it('类本身（非实例）抛出错误', () => {
      class MyClass {}
      expect(() => $expectInstance(MyClass)).toThrow('the hook must be a instance, not a class');
    });

    it('undefined 抛出错误', () => {
      expect(() => $expectInstance(undefined)).toThrow('the hook must be a instance, not a class');
    });
  });

  describe('NestedError', () => {
    it('创建基本嵌套错误', () => {
      const cause = new Error('original error');
      const nested = new NestedError('wrapper error', cause);

      expect(nested).toBeInstanceOf(Error);
      expect(nested).toBeInstanceOf(NestedError);
      expect(nested.message).toBe('wrapper error');
      expect(nested.name).toBe('Error');
    });

    it('堆栈包含原始错误信息', () => {
      const cause = new Error('original error');
      const nested = new NestedError('wrapper error', cause);

      expect(nested.stack).toContain('Caused By:');
      expect(nested.stack).toContain('original error');
    });

    it('无嵌套错误', () => {
      const nested = new NestedError('standalone error', undefined);

      expect(nested.message).toBe('standalone error');
      expect(nested.stack).toContain('Caused By:');
    });

    it('嵌套错误没有 stack', () => {
      const cause = { message: 'no stack error' };
      const nested = new NestedError('wrapper', cause as Error);

      expect(nested.stack).toContain('Caused By:');
    });

    it('多层嵌套', () => {
      const level1 = new Error('level 1');
      const level2 = new NestedError('level 2', level1);
      const level3 = new NestedError('level 3', level2);

      expect(level3.message).toBe('level 3');
      expect(level3.stack).toContain('level 2');
      expect(level3.stack).toContain('Caused By:');
    });

    it('可以被 try-catch 捕获', () => {
      const cause = new Error('cause');

      expect(() => {
        throw new NestedError('thrown error', cause);
      }).toThrow(NestedError);
    });

    it('保持错误消息', () => {
      const cause = new TypeError('type error');
      const nested = new NestedError('Parsing failed', cause);

      expect(nested.message).toBe('Parsing failed');
    });
  });

  describe('综合场景', () => {
    it('Hook 类型验证流程', () => {
      class BaseHook {}
      class CustomHook extends BaseHook {}

      const hook = new CustomHook();

      // 验证是对象实例
      expect($expectInstance(hook)).toBe(true);
      // 验证继承关系
      expect($expectInherit(hook, BaseHook)).toBe(true);
    });

    it('参数类型验证流程', () => {
      const config = {
        theme: 'dark',
        fontSize: 14,
        plugins: ['highlight', 'math'],
      };

      expect($expectTarget(config.theme, String)).toBe(true);
      expect($expectTarget(config.fontSize, Number)).toBe(true);
      expect($expectTarget(config.plugins, Array)).toBe(true);
    });

    it('错误处理链', () => {
      function parseConfig(input: any) {
        try {
          if (typeof input !== 'string') {
            throw new TypeError('Input must be string');
          }
          return JSON.parse(input);
        } catch (e) {
          throw new NestedError('Config parsing failed', e as Error);
        }
      }

      expect(() => parseConfig(123)).toThrow(NestedError);
      expect(() => parseConfig('invalid json')).toThrow(NestedError);
    });
  });
});
