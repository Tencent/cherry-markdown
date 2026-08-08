import { describe, expect, it } from 'vite-plus/test';
import isPlainObject from '@/utils/toolkit/isPlainObject';

describe('utils/toolkit/isPlainObject', () => {
  it('接受普通对象与空原型对象', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
  });

  it('拒绝 null、原始类型、数组及类实例', () => {
    class Configuration {}

    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject('value')).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(new Configuration())).toBe(false);
  });
});
