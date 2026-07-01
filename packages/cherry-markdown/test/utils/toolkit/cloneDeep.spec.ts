import { describe, expect, it } from 'vitest';
import cloneDeep from '@/utils/toolkit/cloneDeep';

describe('utils/toolkit/cloneDeep', () => {
  it('深拷贝嵌套对象与数组', () => {
    const fn = () => {};
    const source = { a: { b: [1, 2] }, fn };
    const cloned = cloneDeep(source);
    expect(cloned).toEqual(source);
    expect(cloned).not.toBe(source);
    expect(cloned.a).not.toBe(source.a);
    expect(cloned.a.b).not.toBe(source.a.b);
    expect(cloned.fn).toBe(fn);
  });

  it('处理循环引用', () => {
    const obj = { a: 1 };
    obj.self = obj;
    const cloned = cloneDeep(obj);
    expect(cloned.a).toBe(1);
    expect(cloned.self).toBe(cloned);
  });

  it('拷贝 Date 与 RegExp', () => {
    const date = new Date('2024-01-01');
    const reg = /abc/gi;
    const cloned = cloneDeep({ date, reg });
    expect(cloned.date).toEqual(date);
    expect(cloned.date).not.toBe(date);
    expect(cloned.reg).toEqual(reg);
    expect(cloned.reg).not.toBe(reg);
  });

  it('原始类型原样返回', () => {
    expect(cloneDeep(42)).toBe(42);
    expect(cloneDeep('hello')).toBe('hello');
    expect(cloneDeep(null)).toBe(null);
  });
});
