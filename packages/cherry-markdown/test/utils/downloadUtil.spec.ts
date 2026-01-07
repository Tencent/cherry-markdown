import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { downloadByATag } from '../../src/utils/downloadUtil';

describe('utils/downloadUtil', () => {
  let mockElement: any;

  beforeEach(() => {
    mockElement = null;
    const originalCreateElement = document.createElement;
    document.createElement = vi.fn((tag: string) => {
      const element = originalCreateElement.call(document, tag);
      if (tag === 'a') {
        mockElement = element;
      }
      return element;
    });
  });

  afterEach(() => {
    document.createElement = vi.fn().mockRestore();
  });

  describe('downloadByATag', () => {
    it('创建带正确属性的anchor元素', () => {
      downloadByATag('http://example.com/file.txt', 'file.txt');
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockElement.href).toBe('http://example.com/file.txt');
      expect(mockElement.download).toBe('file.txt');
    });
  });
});
