import { describe, expect, test, vi } from 'vitest';
import * as config from '../src/config';

vi.mock('vscode', () => ({ workspace: { getConfiguration: vi.fn() } }));

describe('configuration normalization', () => {
  test.each([
    ['active', 'active'],
    ['Active', 'active'],
    ['激活', 'active'],
    ['Активный', 'active'],
    ['only-manual', 'only-manual'],
    ['仅手动', 'only-manual'],
  ])('normalizes usage %s', (value, expected) => {
    expect(config.normalizeUsage(value)).toBe(expected);
  });

  test.each([
    ['default', 'default'],
    ['默认', 'default'],
    ['Тёмная', 'dark'],
    ['Green', 'green'],
    ['红色', 'red'],
  ])('normalizes theme %s', (value, expected) => {
    expect(config.normalizeTheme(value)).toBe(expected);
  });

  test.each([
    ['workspace', 'workspace'],
    ['工作区', 'workspace'],
    ['data', 'data'],
    ['Base64', 'data'],
    ['remote', 'remote'],
    ['自定义上传器', 'remote'],
  ])('normalizes image upload mode %s', (value, expected) => {
    expect(config.normalizeImageUploadMode(value)).toBe(expected);
  });

  test('filters and deduplicates image properties', () => {
    expect(config.normalizeBackfillImageProps(['Border', '边框', 'isRadius', 'invalid'])).toEqual([
      'isBorder',
      'isRadius',
    ]);
  });

  test('falls back for invalid values', () => {
    expect(config.normalizeUsage(null)).toBe('active');
    expect(config.normalizeTheme('unknown')).toBe('default');
    expect(config.normalizeImageUploadMode({})).toBe('workspace');
    expect(config.normalizeBackfillImageProps('isBorder')).toEqual([]);
  });

  test('prefers the globally persisted Cherry theme', () => {
    const globalState = { get: vi.fn().mockReturnValue('dark') };
    expect(config.getTheme(globalState)).toBe('dark');
  });
});
