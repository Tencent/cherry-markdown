import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { copyToClip } from '../../src/utils/copy';

describe('utils/copy', () => {
  let originalExecCommand: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock document.execCommand
    originalExecCommand = (global as any).document.execCommand;
    (global as any).document.execCommand = vi.fn(() => true);
  });

  afterEach(() => {
    (global as any).document.execCommand = originalExecCommand;
  });

  afterEach(() => {
    document.execCommand = originalExecCommand;
    document.addEventListener = originalAddEventListener;
    // Cleanup any added event listeners
    removeListeners.forEach(fn => fn());
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
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });

    it('仅复制HTML', async () => {
      const html = '<p>test content</p>';
      await expect(copyToClip(undefined, html)).resolves.not.toThrow();
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });

    it('同时复制文本和HTML', async () => {
      const text = 'test content';
      const html = '<p>test content</p>';
      await expect(copyToClip(text, html)).resolves.not.toThrow();
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
  });
});
