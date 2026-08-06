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
    ['none', 'none'],
    ['None', 'none'],
    ['自定义上传器', 'custom'],
    ['Пользовательский загрузчик', 'custom'],
    ['PicGoServer', 'picgo'],
  ])('normalizes uploader %s', (value, expected) => {
    expect(config.normalizeUploadType(value)).toBe(expected);
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
    expect(config.normalizeUploadType({})).toBe('none');
    expect(config.normalizeBackfillImageProps('isBorder')).toEqual([]);
  });
});
