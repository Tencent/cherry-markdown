import { describe, expect, it } from 'vitest';
import {
  $expectTarget,
  $expectInherit,
  $expectInstance,
} from '../../src/utils/error';
import NestedError from '../../src/utils/error';

class TestClass {}
class ParentClass {}
class ChildClass extends ParentClass {}

describe('utils/error', () => {
  describe('$expectTarget', () => {
    it('正确类型检测通过', () => {
      const cases = [
        ['test', String],
        [123, Number],
        [[], Array],
        [{}, Object],
      ];
      cases.forEach(([value, type]) => {
        expect($expectTarget(value as any, type as any)).toBe(true);
      });
    });

    it('错误类型检测抛出异常', () => {
      const cases = [
        [123, String],
        ['test', Number],
        [{}, Array],
      ];
      cases.forEach(([value, type]) => {
        expect(() => $expectTarget(value as any, type as any)).toThrow();
      });
    });
  });

  describe('$expectInherit', () => {
    it('正确继承关系检测通过', () => {
      const child = new ChildClass();
      expect($expectInherit(child, ParentClass)).toBe(true);
    });

    it('错误继承关系抛出异常', () => {
      const test = new TestClass();
      expect(() => $expectInherit(test, ParentClass)).toThrow('the hook does not correctly inherit');
    });
  });

  describe('$expectInstance', () => {
    it('实例检测通过', () => {
      const cases = [new TestClass(), {}, []];
      cases.forEach((value) => {
        expect($expectInstance(value)).toBe(true);
      });
    });

    it('非实例检测抛出异常', () => {
      const cases = [
        [undefined],
        ['test'],
        [123],
      ];
      cases.forEach(([value]) => {
        expect(() => $expectInstance(value as any)).toThrow('the hook must be a instance, not a class');
      });
    });
  });

  describe('NestedError', () => {
    it('创建带消息的错误', () => {
      const error = new NestedError('Test message');
      expect(error.message).toBe('Test message');
      expect(error.name).toBe('Error');
    });

    it('创建带嵌套错误的错误', () => {
      const nestedError = new Error('Nested message');
      const error = new NestedError('Outer message', nestedError);
      expect(error.message).toBe('Outer message');
      expect(error.stack).toContain('Outer message');
      expect(error.stack).toContain('Caused By:');
      expect(error.stack).toContain('Nested message');
    });

    it('处理无堆栈的嵌套错误', () => {
      const error = new NestedError('Outer message', {} as any);
      expect(error.message).toBe('Outer message');
      expect(error.stack).toContain('Outer message');
    });
  });
});
