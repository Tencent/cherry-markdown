import { describe, expect, it, vi, beforeEach } from 'vitest';
import { copyToClip } from '../../src/utils/copy';

describe('utils/copy', () => {
  let originalExecCommand: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock document.execCommand
    originalExecCommand = document.execCommand;
    document.execCommand = vi.fn(() => true) as any;
  });

  afterEach(() => {
    document.execCommand = originalExecCommand;
  });

  describe('copyToClip', () => {
    it('未提供内容时抛出异常', async () => {
      const cases = ['', null, undefined];
      for (const content of cases) {
        await expect(copyToClip(content as any)).rejects.toThrow('没有提供任何内容进行复制');
      }
    });

    it('仅复制文本', async () => {
      const text = 'test content';
      await expect(copyToClip(text)).resolves.not.toThrow();
    });

    it('仅复制HTML', async () => {
      const html = '<p>test content</p>';
      await expect(copyToClip(undefined, html)).resolves.not.toThrow();
    });

    it('同时复制文本和HTML', async () => {
      const text = 'test content';
      const html = '<p>test content</p>';
      await expect(copyToClip(text, html)).resolves.not.toThrow();
    });
  });
});
